exports.defaults = {
  server: {
    port: 8400
  },
  security: {
    signing_secret: ""
  },
  session: {
    storage_method: 'disk',
    disk_storage_location: '/tmp/',
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
