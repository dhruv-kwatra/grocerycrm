module.exports = {
  apps: [
    {
      name: "retailcrm",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 4001",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "1G",
      env: { NODE_ENV: "production", PORT: "4001" },
    },
  ],
};
