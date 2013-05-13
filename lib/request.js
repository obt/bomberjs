exports.wrap = function(req) {
  return {
    req: req
  , method: req.method
  , url: req.url
  , headers: req.headers
  }
};
