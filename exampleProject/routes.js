var Router = require('bomber/lib/router').Router;

var router = new Router();

router.add('/', { view: 'simple', action: 'index' });
router.add('/section', { view: 'simple', action: 'section' }) // will return a 500 error as the view doesn't exist
router.add('/section/:id.:format', { view: 'simple', action: 'show' })
router.add('/section/:id', { view: 'simple', action: 'show' })
router.add('/:view/:action/:id')

exports.router = router;
