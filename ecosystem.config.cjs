const fs = require("fs");
try {
  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  for (const l of lines) {
    const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
} catch {}

module.exports = {
  apps: [
    {
      name: "rwsa-judging",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3001,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
