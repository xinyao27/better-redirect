// Service configurations for Better Redirect
// Each service defines redirect rules, allow lists, and display metadata.
// Rule ID allocation: each service gets a 1000-ID range (base + 0~99 for allow, base + 100~999 for redirect).

const SERVICES = {
  npmx: {
    id: "npmx",
    name: "npmx",
    description: "npmjs.com → npmx.dev",
    defaultHost: "https://npmx.dev",
    ruleIdBase: 1000,
    sourceDomain: "www.npmjs.com",

    // Pages that should NOT be redirected (allow rules, priority 5)
    allowList: ["login", "signup", "settings", "support", "policies", "advisories", "products"],

    // Redirect rules (priority determines match order)
    redirects: [
      {
        // Homepage redirect
        priority: 2,
        regexFilter: "^https://www\\.npmjs\\.com/?$",
        substitution: "{host}",
      },
      {
        // Catch-all path redirect
        priority: 1,
        regexFilter: "^https://www\\.npmjs\\.com/(.+)",
        substitution: "{host}/\\1",
      },
    ],

    // Display-only route mappings for popup
    routeMappings: [
      { from: "npmjs.com", to: "npmx.dev" },
      { from: "/package/:name", to: "/package/:name" },
      { from: "/package/@:scope/:name", to: "/package/@:scope/:name" },
      { from: "/package/:name/v/:ver", to: "/package/:name/v/:ver" },
      { from: "/search?q=:query", to: "/search?q=:query" },
      { from: "/~:user", to: "/~:user" },
      { from: "/org/:name", to: "/org/:name" },
    ],
  },

  "better-hub": {
    id: "better-hub",
    name: "Better Hub",
    description: "github.com → better-hub.com",
    defaultHost: "https://beta.better-hub.com",
    ruleIdBase: 2000,
    sourceDomain: "github.com",

    // Pages that should NOT be redirected (allow rules, priority 5)
    allowList: [
      "settings",
      "marketplace",
      "explore",
      "sponsors",
      "login",
      "signup",
      "features",
      "pricing",
      "enterprise",
      "codespaces",
      "new",
      "organizations",
      "topics",
      "collections",
    ],

    // Redirect rules
    redirects: [
      // Specific path rewrites (priority 3)
      {
        // Pull request
        priority: 3,
        regexFilter: "^https://github\\.com/([^/]+)/([^/]+)/pull/(\\d+)",
        substitution: "{host}/\\1/\\2/pull/\\3",
      },
      {
        // Commit
        priority: 3,
        regexFilter: "^https://github\\.com/([^/]+)/([^/]+)/commit/([a-f0-9]+)",
        substitution: "{host}/\\1/\\2/commit/\\3",
      },
      {
        // Action run (actions/runs/X → actions/X)
        priority: 3,
        regexFilter: "^https://github\\.com/([^/]+)/([^/]+)/actions/runs/(\\d+)",
        substitution: "{host}/\\1/\\2/actions/\\3",
      },

      // Global pages (priority 4)
      {
        // Homepage → /dashboard
        priority: 4,
        regexFilter: "^https://github\\.com/?$",
        substitution: "{host}/dashboard",
      },
      {
        // Notifications
        priority: 4,
        regexFilter: "^https://github\\.com/notifications",
        substitution: "{host}/notifications",
      },
      {
        // Trending
        priority: 4,
        regexFilter: "^https://github\\.com/trending",
        substitution: "{host}/trending",
      },
      {
        // Issues
        priority: 4,
        regexFilter: "^https://github\\.com/issues$",
        substitution: "{host}/issues",
      },
      {
        // Pulls → /prs
        priority: 4,
        regexFilter: "^https://github\\.com/pulls$",
        substitution: "{host}/prs",
      },

      // Catch-all repo routes (priority 1)
      {
        // Repo root
        priority: 1,
        regexFilter: "^https://github\\.com/([^/]+)/([^/]+)/?$",
        substitution: "{host}/\\1/\\2",
      },
      {
        // Repo sub-path
        priority: 1,
        regexFilter: "^https://github\\.com/([^/]+)/([^/]+)/(.+)",
        substitution: "{host}/\\1/\\2/\\3",
      },
    ],

    // Display-only route mappings for popup
    routeMappings: [
      { from: "github.com", to: "/dashboard" },
      { from: "/:owner/:repo", to: "/:owner/:repo" },
      { from: "/pull/:n", to: "/pull/:n" },
      { from: "/commit/:sha", to: "/commit/:sha" },
      { from: "/actions/runs/:id", to: "/actions/:id" },
      { from: "/notifications", to: "/notifications" },
      { from: "/trending", to: "/trending" },
      { from: "/pulls", to: "/prs" },
      { from: "/issues", to: "/issues" },
    ],
  },
};
