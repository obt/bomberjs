exports.defaults = {
  server: {
    port: 8400
  },
  security: {
    signing_secret: ""
  },
  persistent_storage: {
    method: 'disk',
    options: {
      location: '/tmp/'
    }
  },
  session: {
    expire_minutes: 600,
    renew_minutes: 10,
    cookie: {
      name: 'session_key',
      domain: '',
      path: '/',
      secure: false
    }
  }
};
