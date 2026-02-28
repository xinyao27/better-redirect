const container = document.getElementById("services");

function renderServices(storedServices) {
  container.innerHTML = "";

  for (const [id, config] of Object.entries(SERVICES)) {
    const svc = storedServices[id] || {};
    const enabled = svc.enabled !== false;
    const host = svc.host || config.defaultHost;

    const card = document.createElement("div");
    card.className = "service-card";

    // Route mappings HTML
    const mappingsHtml = config.routeMappings
      .map(
        (m) =>
          `<div><span class="from">${esc(m.from)}</span><span class="arrow">&rarr;</span><span class="to">${esc(m.to)}</span></div>`,
      )
      .join("");

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
        <details class="mappings">
          <summary>Route mappings</summary>
          <div class="map-list">${mappingsHtml}</div>
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

// Load state and render
chrome.storage.local.get(["services"], (data) => {
  renderServices(data.services || {});
});
