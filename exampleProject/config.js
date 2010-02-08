/* PROJECT CONFIGURATION */

exports.config = {
  server: {
    // Port to run node server on (default 8400)
    //port: 8000,

    security: {
      // A secret key to sign sessions, cookies, passwords etc. 
      // Make sure you set this, and that you keep this secret -- well, secret
      signing_secret: "secret"
    },

    sessions: {
      // How do you want to store the content of sessions
      // Options are:
      // 'disk' [default]: Manage content on disk. You can control the location of 
      //   the on-disk storage in the disk_storage_location parameter.
      // 'cookies': Store in signed cookies. Cookies are a quick and fairly secure
      //   way to store simple session values, but complex data probably shouldn't be
      //   handled with cookies. Also, stuff written to the session after the request
      //   headers have been sent won't be saved.
      storage_method: 'disk',

      // Directory for on-disk storage of sessions
      // Default: '/tmp/'
      disk_storage_location: './storage/',

      // Minutes before sessions expire
      // Default: 600 (10 hours)
      expire_minutes: 600,

      // Minutes before a session is renewed
      // Default: 10 (10 minutes)
      renew_minutes: 10,

      cookie: {
        // Name of the cookie to use for session
        // Default: 'session_key'
        name: 'session_key',
        
        // Domain for the session cookie
        // Default: ''
        domain: '',
        
        // Path for the session cookie
        // Default: '/'
        path: '/',
        
        // Whether to require session cookies only to be sent over secure connections (Boolean)
        // Default: false
        secure: false
      }
    }
  }
};

