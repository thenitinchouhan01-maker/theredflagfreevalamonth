const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { validateBody } = require('../middlewares/validate');
const { createSearchSchema } = require('../validators/search.validator');
const { identifyUser } = require('./user.routes');
const { requireCredits, deductCredit } = require('../middlewares/creditCheck');

router.post('/', 
  identifyUser, 
  validateBody(createSearchSchema), 
  requireCredits,
  searchController.createSearch,
  deductCredit
);

router.get('/', identifyUser, searchController.getUserSearches);

router.get('/:searchId/status', identifyUser, searchController.getSearchStatus);

router.get('/:searchId', identifyUser, searchController.getSearchById);

module.exports = router;
