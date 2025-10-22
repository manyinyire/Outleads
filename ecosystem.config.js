module.exports = {
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
    }
  }
};
