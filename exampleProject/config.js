
/* SERVER */
exports.server = {
  // Port to run node server on 
  // Default: 8400
  port: 8400
}

/* SECURITY */
exports.security = {
  // A secret key to sign sessions, cookies, password etc. 
  // Make sure you set this, and that you keep the secret -- well, secret
  signing_secret: ""
}


/* PERSISTENT STORAGE */
exports.persistent_storage = {
  // Configuration for persistent storage for session and users
  // Options are 'disk' and 'couchdb'
  // Default: 'disk'
  method: 'disk',

  // Options for the persistent storage method
  // Default: {location:'/tmp/'}
  options: {
    location: './storage/'
   }
}


// SESSIONS
exports.session = {
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

