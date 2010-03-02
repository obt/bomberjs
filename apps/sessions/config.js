/* Default session options */

// we are putting this in the project config and not the app config because
// sessions get added to all requests and affect all apps, so you can't have
// app specific settings for sessions.
exports.project_config = {
  sessions: {
    // How do you want to store the content of sessions
    //
    // Options are:
    //
    // + 'disk': Manage content on disk. You can control the location of
    //   the on-disk storage in the disk_storage_location parameter.
    //
    // + 'cookies' [default]: Store in signed cookies. Cookies are a quick and fairly secure
    //   way to store simple session values, but complex data probably shouldn't
    //   be handled with cookies. Also, stuff written to the session after the
    //   request headers have been sent won't be saved.
    manager: 'cookies',

    // Directory for on-disk storage of sessions
    disk_storage_location: '/tmp/',

    // Minutes before sessions expire:
    // default: 24 hours
    expire_minutes: 1440,

    // Minutes before a session is renewed
    renew_minutes: 30,

    cookie: {
      // Name of the cookie to use for session
      name: 'session',
      
      // Domain for the session cookie
      domain: '',
      
      // Path for the session cookie
      // Default: '/'
      path: '/',
      
      // Whether to require session cookies only to be sent over secure
      // connections (Boolean)
      secure: false
    }
  }
};
