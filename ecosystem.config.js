module.exports = {
  apps: [{
    name: 'tarotwall',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: true,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.db',
      '.git'
    ],
    max_memory_restart: '300M',
    log_file: './logs/tarotwall.log',
    out_file: './logs/tarotwall-out.log',
    error_file: './logs/tarotwall-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
