importScripts("services.js");

// Build DNR rules for a single service
function buildServiceRules(config, host) {
  const rules = [];
  const base = config.ruleIdBase;

  // Allow rules (base + 0~99)
  config.allowList.forEach((path, i) => {
    rules.push({
      id: base + i,
      priority: 5,
      action: { type: "allow" },
      condition: {
        urlFilter: `||${config.sourceDomain}/${path}`,
        resourceTypes: ["main_frame"],
      },
    });
  });

  // Redirect rules (base + 100~999)
  config.redirects.forEach((r, i) => {
    rules.push({
      id: base + 100 + i,
      priority: r.priority,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: r.substitution.replace(/\{host\}/g, host),
        },
      },
      condition: {
        regexFilter: r.regexFilter,
        resourceTypes: ["main_frame"],
      },
    });
  });

  return rules;
}

// Read storage and atomically replace all dynamic rules
function syncAllRules() {
  chrome.storage.local.get(["services"], (data) => {
    const stored = data.services || {};
    const allRules = [];

    for (const [id, config] of Object.entries(SERVICES)) {
      const svc = stored[id] || {};
      if (svc.enabled === false) continue;
      const host = svc.host || config.defaultHost;
      allRules.push(...buildServiceRules(config, host));
    }

    chrome.declarativeNetRequest.getDynamicRules((existing) => {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map((r) => r.id),
        addRules: allRules,
      });
    });

    // Update icon based on whether any service is enabled
    const anyEnabled = Object.keys(SERVICES).some((id) => (stored[id] || {}).enabled !== false);
    updateIcon(anyEnabled);
  });
}

// Migrate from old single-service storage format
function migrateStorage(callback) {
  chrome.storage.local.get(["enabled", "host", "services"], (data) => {
    // Already migrated
    if (data.services) {
      callback();
      return;
    }

    // Build new format, preserving old npmx settings
    const npmxEnabled = data.enabled !== false;
    const npmxHost = data.host || SERVICES.npmx.defaultHost;

    const services = {};
    for (const id of Object.keys(SERVICES)) {
      if (id === "npmx") {
        services[id] = { enabled: npmxEnabled, host: npmxHost };
      } else {
        // New services default to disabled during migration to avoid surprising existing users
        services[id] = {
          enabled: false,
          host: SERVICES[id].defaultHost,
        };
      }
    }

    // Write new format and remove old keys
    chrome.storage.local.set({ services }, () => {
      chrome.storage.local.remove(["enabled", "host"], callback);
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // Disable any static rulesets from previous version
  chrome.declarativeNetRequest
    .updateEnabledRulesets({
      disableRulesetIds: ["redirect_rules"],
    })
    .catch(() => {});

  migrateStorage(() => {
    syncAllRules();
  });
});

// Re-sync rules on browser startup to handle edge cases
chrome.runtime.onStartup.addListener(() => {
  syncAllRules();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "toggleService") {
    if (!SERVICES[msg.serviceId]) {
      sendResponse({ ok: false, error: "unknown service" });
      return;
    }
    chrome.storage.local.get(["services"], (data) => {
      const services = data.services || {};
      if (!services[msg.serviceId]) {
        services[msg.serviceId] = {
          enabled: true,
          host: SERVICES[msg.serviceId].defaultHost,
        };
      }
      services[msg.serviceId].enabled = msg.enabled;
      chrome.storage.local.set({ services }, () => {
        syncAllRules();
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (msg.type === "setServiceHost") {
    if (!SERVICES[msg.serviceId]) {
      sendResponse({ ok: false, error: "unknown service" });
      return;
    }
    const host = (msg.host || "").trim().replace(/\/+$/, "");
    try {
      const url = new URL(host);
      if (!["https:", "http:"].includes(url.protocol)) {
        sendResponse({ ok: false, error: "invalid protocol" });
        return;
      }
    } catch {
      sendResponse({ ok: false, error: "invalid URL" });
      return;
    }
    chrome.storage.local.get(["services"], (data) => {
      const services = data.services || {};
      if (!services[msg.serviceId]) {
        services[msg.serviceId] = {
          enabled: true,
          host: SERVICES[msg.serviceId].defaultHost,
        };
      }
      services[msg.serviceId].host = host;
      chrome.storage.local.set({ services }, () => {
        syncAllRules();
        sendResponse({ ok: true });
      });
    });
    return true;
  }
});

function updateIcon(enabled) {
  const path = enabled ? "icons/icon" : "icons/icon-disabled";
  chrome.action
    .setIcon({
      path: { 16: `${path}-16.png`, 48: `${path}-48.png` },
    })
    .catch(() => {});
}
