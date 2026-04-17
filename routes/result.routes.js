const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const { identifyUser } = require('./user.routes');

router.get('/search/:searchId', identifyUser, resultController.getResultBySearchId);
router.get('/', identifyUser, resultController.getUserResults);
router.get('/:resultId', identifyUser, resultController.getResultById);

module.exports = router;
