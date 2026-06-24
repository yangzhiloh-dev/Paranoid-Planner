/*feed data into dashboard from usrs points s*/

const express = require('express');
const router = express.Router();
const productivityController = require('../controllers/productivityController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', productivityController.getSummary);

module.exports = router;
/*simple productivity route */
