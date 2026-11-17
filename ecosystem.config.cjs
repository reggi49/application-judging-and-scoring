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
        PORT: process.env.PORT || 3002,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
