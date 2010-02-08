var http = require("./http");
var url = require("url");
var sys = require("sys");
var events = require("events");

try {
  var compress = require("./compress");
}
catch(err) {
  if( err.message.indexOf("Cannot find module") >= 0 ) {
    var compress = null;
  }
  else {
    throw err;
  }
}

function httpclient() {
	var cookies = [];

  if( compress !== null ) {
    var gunzip = new compress.Gunzip;
  }
					
	var clients = {
	};

	this.clients = clients;
	
	this.perform = function(rurl, method, cb, data, exheaders, tlscb) {
		this.clientheaders = exheaders;
		var curl = url.parse(rurl);
		var key = curl.protocol + "//" + curl.hostname;
		
		if(!clients[key]) {
			var client = null;
			if(!curl.port) {
				switch(curl.protocol) {
					case "https:":
						client = http.createClient(443, curl.hostname);
						client.setSecure("x509_PEM");
						break;
					default:
						client = http.createClient(80, curl.hostname);
						break;
				}
			}
			else {
				client = http.createClient(parseInt(curl.port), curl.hostname);
			}
			clients[key] = {
				"http": client,
				"headers": {}
			};
		}
		
		clients[key].headers = {
			"User-Agent": "Node-Http",
			"Accept" : "*/*",
			"Connection" : "close",
			"Host" : curl.hostname
		};
		if(method == "POST") {
			clients[key].headers["Content-Length"] = data.length;
			clients[key].headers["Content-Type"] = "application/x-www-form-urlencoded";
		}
		for (attr in exheaders) { clients[key].headers[attr] = exheaders[attr]; }		

		var mycookies = [];

		cookies.filter(function(value, index, arr) {
			if(curl.pathname) {
				return(curl.hostname.substring(curl.hostname.length - value.domain.length) == value.domain && curl.pathname.indexOf(value.path) >= 0);
			}
			else {
				return(curl.hostname.substring(curl.hostname.length - value.domain.length) == value.domain);
			}
		}).forEach( function(cookie) {
			mycookies.push(cookie.value);
		});
		if( mycookies.length > 0 ) {
			clients[key].headers["Cookie"] = mycookies.join(";");
		}
		
		var target = "";
		if(curl.pathname) target += curl.pathname;
		if(curl.search) target += curl.search;
		if(curl.hash) target += curl.hash;
		if(target=="") target = "/";
		
		var req = clients[key].http.request(method, target, clients[key].headers);

		if(method == "POST") {
			req.sendBody(data);
		}
		
		req.finish(function(res) {
			var mybody = [];
			if(tlscb) {
				if(!tlscb({
						"status" : res.connection.verifyPeer(), 
						"certificate" : res.connection.getPeerCertificate("DNstring")
					}
				)) {
					cb(-2, null, null);		
					return;
				}
			}
			res.setBodyEncoding("utf8");
			if(res.headers["content-encoding"] == "gzip") {
				res.setBodyEncoding("binary");
			}
			res.addListener("body", function(chunk) {
				mybody.push(chunk);
			});
			res.addListener("complete", function() {
				var body = mybody.join("");
				if( compress !== null && res.headers["content-encoding"] == "gzip") {
					gunzip.init();
					body = gunzip.inflate(body, "binary");
					gunzip.end();
				}
				var resp = {
					"response": {
						"status" : res.statusCode,
						"headers" : res.headers,
						"body-length" : body.length,
						"body" : body
					},
					"request": {
						"url" : rurl,
						"headers" : clients[key].headers
					}
				}
				cb(resp);	
			});
			res.addListener("error", function() {
				cb(-1, res.headers, mybody.join(""));		
			});
			if(res.headers["set-cookie"]) {
				res.headers["set-cookie"].forEach( function( cookie ) {
					props = cookie.split(";");
					var newcookie = {
						"value": "",
						"domain": "",
						"path": "/",
						"expires": ""
					};
					
					newcookie.value = props.shift();
					props.forEach( function( prop ) {
						var parts = prop.split("="),
						name = parts[0].trim();
						switch(name.toLowerCase()) {
							case "domain":
								newcookie.domain = parts[1].trim();
								break;
							case "path":
								newcookie.path = parts[1].trim();
								break;
							case "expires":
								newcookie.expires = parts[1].trim();
								break;
						}
					});
					if(newcookie.domain == "") newcookie.domain = curl.hostname;
					var match = cookies.filter(function(value, index, arr) {
						if(value.domain == newcookie.domain && value.path == newcookie.path && value.value.split("=")[0] == newcookie.value.split("=")[0]) {
							arr[index] = newcookie;
							return true;
						}
						else {
							return false;
						}
					});
					if(match.length == 0) cookies.push(newcookie);
				});
			}
		});
	}

	this.getCookie = function(domain, name) {
		var mycookies = cookies.filter(function(value, index, arr) {
				return(domain == value.domain);
			});
		for( var i=0; i < mycookies.length; i++ ) {
			parts = mycookies[i].value.split("=");
			if( parts[0] == name ) {
				return parts[1];
			}
		}

		return null;
	}
}
sys.inherits(httpclient, events.EventEmitter);
exports.httpclient = httpclient;
