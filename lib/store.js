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
    sha1 = require('../dependencies/sha1');

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
        return posix.mkdir(location, 0700);
    };
   
    var createReadmeFile = function () {
        var p = new events.Promise();

        // Chained callbacks are so stylistically shitty.
        posix.open(readmePath, process.O_CREAT | process.O_WRONLY, 0644)
        .addCallback(function (fd) {
            posix.write(fd,
                "This is a data storage location for DirectoryStore.\r\n")
            .addCallback(function (written) {
                posix.close(fd)
                .addCallback(function () {
                    p.emitSuccess();
                })
                .addErrback(function(e) {
                    p.emitError(e);
                });
            })
            .addErrback(function (e) {
                p.emitError(e);
            });
        })
        .addErrback(function (e) {
            p.emitError(e);
        });

        return p;
    };

    /* getLocation()
     *
     * Returns the directory path used by the data store.
     */
    var getLocation = function (location) {
        return this.location;
    };
    this.getLocation = getLocation;

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
        var p = new events.Promise();

        var writeAndMkdir = function () {
            // write first, then mkdir
            var wp = new events.Promise();

            atomicWrite(nameFile, JSON.stringify(namespace), 0600)
            .addCallback(function () {
                posix.mkdir(namespacePath, 0700)
                .addCallback(function () {
                    wp.emitSuccess();
                })
                .addErrback(function (e) {
                    posix.unlink(nameFile);
                    wp.emitError(e);
                });
            })
            .addErrback(function (e) {
                if (e.message === "File exists")
                    wp.emitSuccess();
                else
                    wp.emitError(e);
            });

            return wp;
        };

        posix.stat(namespacePath)
        .addCallback(function (stats) {
            // nameFile exists, check that it's a directory
            if (!stats.isDirectory()) {
                p.emitError({
                    message: "Namespace exists but is not a directory"
                });
            } else {
                // Everything is okay, write meta file and return
                atomicWrite(nameFile, JSON.stringify(namespace), 0600)
                .addCallback(function () {
                    validNamespaces[namespace] = namespacePath;
                    p.emitSuccess();
                })
                .addErrback(function (e) { p.emitError(e); });
            }
        })
        .addErrback(function (e) {
            // stat error
            if (e.message !== "No such file or directory") {
                p.emitError(e);
            } else {
                // File doesn't exist, we'll create it
                writeAndMkdir()
                .addCallback(function () {
                    validNamespaces[namespace] = namespacePath;
                    p.emitSuccess();
                })
                .addErrback(function (e) { p.emitError(e); });
            }
        });

        return p;
    };
    this.assertNamespace = assertNamespace;
    
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
        
        atomicWrite(key_filename, JSON.stringify(key), 0600)
        .addCallback(function() {
            atomicWrite(filename, JSON.stringify(value), 0600)
            .addCallback(function() {
                p.emitSuccess();
            })
            .addErrback(function(e) {
                p.emitError(e);
            });
        })
        .addErrback(function(e) {
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

    var createLocationAndReadmeFile = function () {
        var p = new events.Promise();

        createLocation()
        .addCallback(function () {
            createReadmeFile()
            .addCallback(function () {
                p.emitSuccess();
            })
            .addErrback(function (e) {
                p.emitError(e);
            });
        })
        .addErrback(function (e) {
            if (e.message === "File exists") {
                // We are okay
                p.emitSuccess();
            } else {
                p.emitError(e);
            }
        });

        return p;
    };

    // Promise for opening purposes
    var p = new events.Promise();

    var that = this;
    
    // Initialization
    posix.stat(location)
    .addCallback(function (stats) {
        // Stat returned
        if (!stats.isDirectory()) {
            p.emitError({
                message: "Path exists but is not a directory"
            });
        } else {
            // Success so far
            // We unlink every time to make sure that we have the correct
            // permissions.

            posix.unlink(readmePath)
            .addCallback(function () {
                createReadmeFile()
                .addCallback(function () {
                    p.emitSuccess(that);
                }).addErrback(function (e) {
                    p.emitError(e);
                });
            })
            .addErrback(function (e) {
                // Unlink error
                if (e.message !== "No such file or directory") {
                    p.emitError(e);
                } else {
                    createReadmeFile()
                    .addCallback(function () {
                        p.emitSuccess(that);
                    })
                    .addErrback(function (e) {
                        p.emitError(e);
                    });
                }
            });
        }
    })
    .addErrback(function (e) {
        // directory doesn't exist
        createLocationAndReadmeFile()
        .addCallback(function () {
            p.emitSuccess(that);
        })
        .addErrback(function (e) {
            p.emitError(e);
        });
    });

    return p;
};
