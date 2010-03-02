exports.load = function(app, project) {
  if( typeof project.sessionManager === 'undefined' ) {
    if( !project.config.sessions.manager ) {
      project.config.sessions.manager = 'cookies';
    }
    if( ['disk', 'cookies'].indexOf(project.config.sessions.manager) >= 0 ) {
      project.config.sessions.manager = './lib/managers/' + project.config.sessions.manager;
    }

    var manager = require(project.config.sessions.manager);

    project.sessionManager = null;
    project.pipe('startup', function() { return manager.startup(project); });
  }
};
