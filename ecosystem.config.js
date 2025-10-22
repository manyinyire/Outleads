module.exports = {
  apps: [
    {
      name: 'Outrisk-Leads-Application',
      script: 'yarn',
      args: 'start -p 3010',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};

