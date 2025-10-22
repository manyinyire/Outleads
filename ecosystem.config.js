module.exports = {
<<<<<<< HEAD
  apps: [{
    name: 'Outrisk-',
    script: 'yarn',
    args: 'start',
    interpreter: '/root/.nvm/versions/node/v22.21.0/bin/node',
    cwd: '/var/outrisk/Outleads',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/outrisk/Outleads/logs/err.log',
    out_file: '/var/outrisk/Outleads/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }],

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
=======
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
>>>>>>> 99ce9e5df0419e6147deb4f7eddb18f11d056f7a
    }
  ]
};

