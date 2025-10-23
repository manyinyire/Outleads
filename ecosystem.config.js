module.exports = {
  apps: [
    {
      name: 'Outrisk-',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/outrisk/Outleads',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/outrisk/Outleads/logs/err.log',
      out_file: '/var/outrisk/Outleads/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'stagingapp',
      ref: 'origin/main',
      repo: 'GIT_REPOSITORY',
      path: '/var/outrisk/Outleads',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install && yarn build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
