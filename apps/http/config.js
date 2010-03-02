/* Default server options */

// we are putting this in the project config and not the app config because
// a server will only get created once for each project, so you can't have
// app specific settings for the server.
exports.project_config = {
  server: {
    // port to listen on
    port: 8400
  }
};

exports.apps = [
  './apps/cookies'
];
