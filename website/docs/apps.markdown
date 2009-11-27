---
layout: docs
title: App Structure
---

Apps are just a bunch of functionallity wrapped up into a folder.  Bomber
will look for the following files/folders (all of them are optional):

+ `config.js`   
  This stores configuration for the app. A [Server](/docs/server.html) will look for the following
  exports:

  `apps`
  :  an array of apps that this app depends on.  The Server preloads all apps it is going to need.
  
+ `routes.js`   
  should export a [Router object](/docs/router.html)

+ `views/<view-name>.js`   
  a view file exports functions (called actions to steal from Rails) that will
  be called on an [Action object](/docs/action.html)
