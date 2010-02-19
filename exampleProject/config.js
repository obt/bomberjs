/* PROJECT CONFIGURATION */
exports.project_config = {
  sessions: {
    storage_method: 'disk',
    disk_storage_location: './storage/',
    cookie: {
      name: 'session_key',
    }
  },

  security: {
    signing_secret: "secret"
  },
};

exports.apps = ['bomberjs/apps/sessions'];
