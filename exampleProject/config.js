/* PROJECT CONFIGURATION */
exports.project_config = {
  security: {
    signing_secret: "secret"
  },
};

exports.apps = [
  'bomberjs/apps/http',
  'bomberjs/apps/sessions'
];
