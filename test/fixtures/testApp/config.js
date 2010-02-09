
exports.project_config = {
  server: {
    port: 8342
  },
  security: {
    signing_secret: 'secret'
  }
};

exports.apps_config = {
  '.': {
    option_one: 1,
    option_two: 2
  },

  'subApp1': {
    option: false
  },

  './subApp1': {
    option: true
  }
};

exports.apps = [
  "./apps/subApp1"
];

