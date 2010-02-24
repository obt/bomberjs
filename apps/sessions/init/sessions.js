exports.load = function(app, project) {
  if( typeof project.sessionManager === 'undefined' ) {
    if( !project.config.sessions.storage_method ) {
      project.config.sessions.storage_method = 'cookies';
    }
    if( ['disk', 'cookies'].indexOf(project.config.sessions.storage_method) >= 0 ) {
      project.config.sessions.storage_method = '../lib/managers/' + project.config.sessions.storage_method;
    }

    var manager = require(project.config.sessions.storage_method);

    project.sessionManager = null;
    project.server.listen('start', function() { return manager.start(project); });
  }
};
