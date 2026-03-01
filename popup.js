const container = document.getElementById("services");

// Placeholder examples per service
const BLACKLIST_PLACEHOLDERS = {
  npmx: "lodash",
  "better-hub": "microsoft/vscode",
};

// Track open state of details elements across re-renders
const openStates = {};

function renderServices(storedServices) {
  // Preserve open states before clearing
  document.querySelectorAll("[data-blacklist-for]").forEach((el) => {
    openStates[`blacklist-${el.dataset.blacklistFor}`] = el.open;
  });
  document.querySelectorAll(".mappings").forEach((el) => {
    const card = el.closest(".service-card");
    if (card) {
      const checkbox = card.querySelector("[data-service]");
      if (checkbox) openStates[`mappings-${checkbox.dataset.service}`] = el.open;
    }
  });

  container.innerHTML = "";

  for (const [id, config] of Object.entries(SERVICES)) {
    const svc = storedServices[id] || {};
    const enabled = svc.enabled !== false;
    const host = svc.host || config.defaultHost;
    const blacklist = svc.blacklist || [];

    const card = document.createElement("div");
    card.className = "service-card";

    // Route mappings HTML
    const mappingsHtml = config.routeMappings
      .map(
        (m) =>
          `<div><span class="from">${esc(m.from)}</span><span class="arrow">&rarr;</span><span class="to">${esc(m.to)}</span></div>`,
      )
      .join("");

    // Blacklist items HTML
    const blacklistItemsHtml = blacklist.length
      ? blacklist
          .map(
            (path) =>
              `<div class="blacklist-item"><span class="path">${esc(path)}</span><button class="remove-btn" data-remove-path="${esc(path)}" data-remove-from="${esc(id)}">&times;</button></div>`,
          )
          .join("")
      : `<div class="blacklist-empty">No blocked paths</div>`;

    const placeholder = BLACKLIST_PLACEHOLDERS[id] || "path/to/block";
    const mappingsOpen = openStates[`mappings-${id}`] ? " open" : "";
    const blacklistOpen = openStates[`blacklist-${id}`] ? " open" : "";

    card.innerHTML = `
      <div class="service-top">
        <div class="service-info">
          <span class="service-name">${esc(config.name)}</span>
        </div>
        <label class="toggle">
          <input type="checkbox" data-service="${esc(id)}" ${enabled ? "checked" : ""}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="service-desc">${esc(config.description)}</div>
      <div class="service-details">
        <hr class="divider">
        <label class="field">Instance URL</label>
        <div class="host-row">
          <input type="text" data-host-for="${esc(id)}" value="${esc(host)}" placeholder="${esc(config.defaultHost)}">
          <button class="save-btn" data-save-for="${esc(id)}">Save</button>
        </div>
        <details class="mappings"${mappingsOpen}>
          <summary>Route mappings</summary>
          <div class="map-list">${mappingsHtml}</div>
        </details>
        <details class="blacklist" data-blacklist-for="${esc(id)}"${blacklistOpen}>
          <summary>Blocked paths (${blacklist.length})</summary>
          <div class="blacklist-add">
            <input type="text" data-bl-input-for="${esc(id)}" placeholder="${esc(placeholder)}">
            <button class="save-btn" data-bl-add-for="${esc(id)}">Add</button>
          </div>
          <div class="blacklist-items">${blacklistItemsHtml}</div>
        </details>
      </div>
    `;

    container.appendChild(card);
  }

  bindEvents();
}

function bindEvents() {
  // Toggle events
  document.querySelectorAll("[data-service]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      chrome.runtime.sendMessage({
        type: "toggleService",
        serviceId: checkbox.dataset.service,
        enabled: checkbox.checked,
      });
    });
  });

  // Save events
  document.querySelectorAll("[data-save-for]").forEach((btn) => {
    const serviceId = btn.dataset.saveFor;
    const input = document.querySelector(`[data-host-for="${serviceId}"]`);

    btn.addEventListener("click", () => {
      const host = input.value.trim().replace(/\/+$/, "");
      if (!host) return;
      chrome.runtime.sendMessage({ type: "setServiceHost", serviceId, host }, () => {
        btn.textContent = "Saved";
        btn.classList.add("saved");
        setTimeout(() => {
          btn.textContent = "Save";
          btn.classList.remove("saved");
        }, 1500);
      });
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  });

  // Blacklist add events
  document.querySelectorAll("[data-bl-add-for]").forEach((btn) => {
    const serviceId = btn.dataset.blAddFor;
    const input = document.querySelector(`[data-bl-input-for="${serviceId}"]`);

    btn.addEventListener("click", () => {
      const path = input.value.trim().replace(/^\/+|\/+$/g, "");
      if (!path) return;
      chrome.runtime.sendMessage(
        { type: "addBlacklistItem", serviceId, path },
        (res) => {
          if (res && res.ok) {
            input.value = "";
            reloadAndRender();
          }
        },
      );
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  });

  // Blacklist remove events
  document.querySelectorAll("[data-remove-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const serviceId = btn.dataset.removeFrom;
      const path = btn.dataset.removePath;
      chrome.runtime.sendMessage(
        { type: "removeBlacklistItem", serviceId, path },
        (res) => {
          if (res && res.ok) {
            reloadAndRender();
          }
        },
      );
    });
  });
}

// Escape for safe HTML attribute and text content injection
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function reloadAndRender() {
  chrome.storage.local.get(["services"], (data) => {
    renderServices(data.services || {});
  });
}

// Load state and render
reloadAndRender();
