var config = require('./lib/config')

exports.config = {
  app_name: ['NodeGear Frontend'],
  license_key: config.credentials.newrelic_key,
  logging: {
    level: 'warn',
    filepath: 'stdout'
  },
  agent_enabled: config.production,
  rules: {
    ignore: [
      '^/socket.io/.*/*-polling',
      '^/ping$',
      '^/socket.io/*',
      '^/socket.io/',
      '^/socket.io'
    ]
  }
};
