const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { identifyUser } = require('./user.routes');

// Create report
router.post('/', identifyUser, reportController.createReport);

// Get user's reports
router.get('/', identifyUser, reportController.getUserReports);

// Get report by search ID - MUST be before /:reportId
router.get('/search/:searchId', identifyUser, reportController.getReportBySearchId);

// Get report by ID
router.get('/:reportId', identifyUser, reportController.getReportById);

// Get report data (full JSON) - MUST be before /:reportId catch-all but after /search/:searchId
router.get('/:reportId/data', identifyUser, reportController.getReportData);

// Mark report as downloaded
router.post('/:reportId/download', identifyUser, reportController.markAsDownloaded);

// Archive report
router.post('/:reportId/archive', identifyUser, reportController.archiveReport);

module.exports = router;
