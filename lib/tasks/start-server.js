exports.task = function(app) {
  var BomberServer = require('bomberjs/lib/server').Server;
  var bs = new BomberServer(app);
  //sys.p(bs);
  bs.start();
};
