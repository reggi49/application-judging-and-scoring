module.exports = {
  apps: [
    {
      name: "rwsa-judging",
      script: "npm",
      args: "run start -- -H 0.0.0.0 -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
