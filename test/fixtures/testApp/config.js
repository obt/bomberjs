
exports.config = {
  'server': {
    port: 8342,
    signing_secret: 'secret'
  },

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
]
