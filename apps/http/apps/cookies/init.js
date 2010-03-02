var sys = require('sys');

var Cookies = require('./lib/cookies').Cookies;

exports.load = function(app, project) {
  project.pipe('request', { name: 'cookies' }, function(rr) {
      var request = rr.request,
          response = rr.response;

      request.cookies = response.cookies = new Cookies(request, response, project);

      response.listen('head', function(head) {
        response.cookies.writeHeaders(head.headers);
        return head;
      });

      return rr;
    });
};
