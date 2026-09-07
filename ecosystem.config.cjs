// PM2 process manager configuration for NATGAS Uganda API server.
// Usage:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 save
//   pm2 startup   (follow the printed command to enable start-on-boot)
//
// Logs are written to ~/.pm2/logs/ by default. The app also writes structured
// logs to ./logs/ when NODE_ENV=production.

module.exports = {
  apps: [
    {
      name: 'natgas-api',
      script: './server/dist/index.js',

      // Working directory must contain the compiled output and the .env file.
      cwd: '/var/www/natgas',

      // Node.js interpreter arguments.
      node_args: '--max-old-space-size=512',

      // Number of instances. 'max' uses all CPU cores; a fixed number (e.g. 2)
      // is more predictable on small VPS instances.
      instances: 1,

      // Restart the process automatically if it exits.
      autorestart: true,

      // Watch for file changes in production is disabled — use deployments instead.
      watch: false,

      // Memory threshold: PM2 will gracefully restart the process if RSS
      // exceeds this value. Adjust based on available RAM.
      max_memory_restart: '400M',

      // Environment variables for production.
      // Sensitive values (DATABASE_URL, SESSION_SECRET, SMTP credentials, etc.)
      // must be set in server/.env — do not put them here.
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1',
      },

      // Graceful shutdown: allow 10 seconds for in-flight requests to finish.
      kill_timeout: 10000,

      // Merge stdout and stderr into a single log file per instance.
      merge_logs: true,

      // Log date format.
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Wait this long before restarting after a crash (ms). Avoids a crash loop.
      restart_delay: 4000,

      // PM2 considers the process stable once it has been up for this long (ms).
      // Prevents rapid-restart loops being counted as a successful start.
      min_uptime: 5000,
    },
  ],
};
