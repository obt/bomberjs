// Simple file-based storage of JSON objects
// Guan Yang (guan@yang.dk), 2010-01-30

// Very simple persistent storage for JSON objects. I rely heavily on
// POSIX filesystem semantics. This store is not very efficient because
// it stores each document as a separate file, to facilitate atomic
// writes in an easy way, but it should scale reasonably well on modern
// filesystems.

// No locks are necessary or possible. There is no multi-version
// concurrency control (MVCC), but this may be added later.

var posix = require("posix"),
    path = require("path"),
    sys = require("sys"),
    events = require("events"),
    sha1 = require("./sha1");

/* DirectoryStore()
 * 
 * DirectoryStore provides a very simple persistent storage system for
 * JSON objects. It relies heavily on POSIX filesystem semantics to
 * enable atomic writes. It is not very efficient because it stores
 * each document in a separate file, but it should scale reasonably well
 * on modern filesystems that support a large number of files in a
 * directory.
 */
var DirectoryStore = exports.DirectoryStore = function (location) {
    var readmePath = path.join(location, "DirectoryStore.txt");
    
    validNamespaces = {};

    var createLocation = function () {
        posix.mkdir(location, 0700).wait();
    };
   
    var createReadmeFile = function () {
        var fd =
            posix.open(readmePath, process.O_CREAT | process.O_WRONLY, 0644)
            .wait();
        posix.write(fd,
            "This is a data storage location for DirectoryStore.\r\n").wait();
        posix.close(fd).wait();
    };

    /* getLocation()
     *
     * Returns the directory path used by the data store.
     */
    var getLocation = function (location) {
        return this.location;
    };
    this.getLocation = getLocation;

    /* assertNamespace(namespace)
     *
     * Ensure that a namespace exists, and if it does not, create it.
     */
    var assertNamespace = function (namespace) {
        // Our cache of already created namespaces
        if (validNamespaces.hasOwnProperty(namespace)) {
            return true;
        }
        
        var namespacePath = path.join(location, sha1.hex_sha1(namespace));
        var nameFile = namespacePath + ".namespace";
        var p;
                
        // TODO: rewrite to use promises
        try {
            try {
                nameStats = posix.stat(nameFile).wait();
            } catch (e) {
                if (e.message !== "No such file or directory") {
                    throw e;
                } else {
                    p = atomicWrite(nameFile, JSON.stringify(namespace), 0600);
                    p.wait();
                }
            }

            stats = posix.stat(namespacePath).wait();
            
            if (!stats.isDirectory()) {
                // Oh boy
                throw {
                    message: "Namespace exists but is not a directory"
                }
            }
        } catch (e) {
            if (e.message !== "No such file or directory") {
                throw e;
            }
            
            posix.mkdir(namespacePath, 0700).wait();
        }
            
        // We're okay
        validNamespaces[namespace] = namespacePath;
        return true;
    };
    
    var valuePath = function(namespace, key) {
        // Values are stored in a file with the sha1
        var namespacePart = sha1.hex_sha1(namespace);
        
        // If key is not a string, JSON it
        if (typeof key !== "string") {
            key = JSON.stringify(key);
        }
        
        var keyPart = sha1.hex_sha1(key);
        
        if (key.length) {
            keyPart += "-" + key.length;
        }
        
        return path.join(location, namespacePart, keyPart);
    }
    
    /* get(namespace, key)
     * 
     * Retrieve a value from the directory store based on namespace and key.
     * Both namespace and key SHOULD be strings.
     */
    var get = function(namespace, key) {
        var filename = valuePath(namespace, key);
        var p = new events.Promise();
        var catPromise = posix.cat(filename);
        
        catPromise.addCallback(function(content) {
           p.emitSuccess(JSON.parse(content)); 
        });
        
        catPromise.addErrback(function(e) {
            p.emitError(e);
        });
        
        return p;
    };
    this.get = get;
    
    /* unset(namespace, key)
     * 
     * Remove a value from the directory store.
     */
    var unset = function(namespace, key) {
        var filename = valuePath(namespace, key);
        var key_filename = filename + ".key";
        posix.unlink(key_filename);
        return posix.unlink(filename);
    }
    this.unset = unset;
    
    var atomicWrite = function(filename, value, mode) {
        if (typeof value !== "string") {
            throw {
                message: "Value must be a string"
            }
        }
        
        var p = new events.Promise();
        
        /* Create a proper temp filename */
        var date = new Date();
        var tmp = process.platform + "." + process.pid + "." +
            Math.round(Math.random()*1e6) + "." + (+date) + "." +
            date.getMilliseconds();
        var filenameTmp = filename + "." + tmp + ".tmp";
        
        var openPromise = posix.open(filenameTmp,
            process.O_CREAT|process.O_WRONLY, mode);
            
        openPromise.addCallback(function(fd) {
            var writePromise = posix.write(fd, value);
            writePromise.addCallback(function(written) {
                var closePromise = posix.close(fd);
                closePromise.addCallback(function() {
                    var renamePromise = posix.rename(filenameTmp, filename);
                    renamePromise.addCallback(function() {
                        // Rename was successful
                        p.emitSuccess();
                    });
                    renamePromise.addErrback(function(e) {
                        // Rename failed, remove the tmp but don't
                        // wait for that.
                        posix.unlink(filenameTmp);
                        p.emitError(e);
                    });
                });
                closePromise.addErrback(function(e) {
                    // Close failed, remove the tmp and complain, no wait
                    posix.unlink(filenameTmp);
                    p.emitError(e);
                });
            });
            writePromise.addErrback(function(e) {
                // write failed, close and remove the tmp, again, don't
                // wait
                var writeFailPromise = posix.close(fd);
                writeFailPromise.addCallback(function() {
                    posix.unlink(filenameTmp);
                });
                writeFailPromise.addErrback(function(e) {
                    posix.unlink(filenameTmp);
                });
                
                p.emitError(e);
            });
        });
        
        openPromise.addErrback(function(e) {
            // open failed, complain
            p.emitError(e);
        });
        
        return p;
    }
    
    /* set(namespace, key, value)
     *
     * Save a value to the directory store indexed by namespace and key.
     * Both namespace and key SHOULD be strings. value can be any value that
     * can be serialized by JSON.stringify.
     */
    var set = function(namespace, key, value) {
        assertNamespace(namespace);
        var filename = valuePath(namespace, key);
        var key_filename = filename + ".key";
        
        var p = new events.Promise();
        
        var keyPromise = atomicWrite(key_filename, JSON.stringify(key), 0600);
        keyPromise.addCallback(function() {
            var writePromise = atomicWrite(filename, JSON.stringify(value), 0600);
            writePromise.addCallback(function() {
                p.emitSuccess();
            });
            writePromise.addErrback(function(e) {
                p.emitError(e);
            });
        });
        keyPromise.addErrback(function(e) {
            p.emitError(e);
        });
        
        return p;
    };
    this.set = set;
    
    
    
    /* close()
     * 
     * This is a NOOP in DirectoryStore, but may be useful for other types of
     * data stores.
     */
    var close = function() {
        /* we need to do something; we'll stat the readme file. */
        return posix.stat(readmePath);
    };
    this.close = close;
    
    // If the file exists, make sure that it is a directory and that it
    // writable.
    try {
        stats = posix.stat(location).wait();
        
        if (!stats.isDirectory()) {
            throw {
                message: "Path exists but is not a directory"
            };
        }
        
        // We unlink every time to make sure that we have the correct
        // permissions.    
        try {
            posix.unlink(readmePath).wait();
            createReadmeFile();
        } catch (e) {
            if (e.message !== "No such file or directory") {
                throw e;
            } else {
                createReadmeFile();
            }
        }
    } catch (e) {
        if (e.message !== "No such file or directory") {
            throw e;
        } else {
            createLocation();
            createReadmeFile();
        }
    } 
};
