const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

class ReportController {
  /**
   * Create a report from a result
   * POST /api/reports
   */
  createReport = asyncHandler(async (req, res) => {
    const { resultId } = req.body;
    const userId = req.user._id;

    const report = await reportService.createReportFromResult(resultId, userId);

    const response = new ApiResponse(res);
    response.created({
      report: {
        id: report._id,
        searchId: report.searchId,
        resultId: report.resultId,
        version: report.version,
        format: report.format,
        createdAt: report.createdAt
      }
    }, 'Report created successfully');
  });

  /**
   * Get user's reports
   * GET /api/reports
   */
  getUserReports = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20, includeArchived = false } = req.query;

    const reports = await reportService.getUserReports(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      includeArchived: includeArchived === 'true'
    });

    const response = new ApiResponse(res);
    response.success({
      reports: reports.map(report => ({
        id: report._id,
        searchId: report.searchId,
        search: report.searchId ? {
          id: report.searchId._id,
          searchType: report.searchId.searchType,
          nameQuery: report.searchId.nameQuery,
          usernameQuery: report.searchId.usernameQuery,
          status: report.searchId.status,
          createdAt: report.searchId.createdAt
        } : null,
        resultId: report.resultId,
        version: report.version,
        format: report.format,
        isDownloaded: report.isDownloaded,
        downloadCount: report.downloadCount,
        isArchived: report.isArchived,
        createdAt: report.createdAt
      }))
    });
  });

  /**
   * Get report by search ID
   * GET /api/reports/search/:searchId
   */
  getReportBySearchId = asyncHandler(async (req, res) => {
    const { searchId } = req.params;
    const userId = req.user._id;

    const report = await reportService.getReportBySearchId(searchId, userId);

    const response = new ApiResponse(res);
    response.success({
      report: {
        id: report._id,
        searchId: report.searchId,
        resultId: report.resultId,
        version: report.version,
        format: report.format,
        isDownloaded: report.isDownloaded,
        downloadCount: report.downloadCount,
        createdAt: report.createdAt
      }
    });
  });

  /**
   * Get report by ID
   * GET /api/reports/:reportId
   */
  getReportById = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    const report = await reportService.getReportById(reportId, userId);

    const response = new ApiResponse(res);
    response.success({
      report: {
        id: report._id,
        searchId: report.searchId,
        search: report.searchId ? {
          id: report.searchId._id,
          searchType: report.searchId.searchType,
          nameQuery: report.searchId.nameQuery,
          usernameQuery: report.searchId.usernameQuery,
          status: report.searchId.status,
          createdAt: report.searchId.createdAt
        } : null,
        resultId: report.resultId,
        version: report.version,
        format: report.format,
        isDownloaded: report.isDownloaded,
        downloadCount: report.downloadCount,
        isArchived: report.isArchived,
        expiresAt: report.expiresAt,
        createdAt: report.createdAt
      }
    });
  });

  /**
   * Get report data (full JSON)
   * GET /api/reports/:reportId/data
   */
  getReportData = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    const reportData = await reportService.getReportData(reportId, userId);

    const response = new ApiResponse(res);
    response.success({ report: reportData });
  });

  /**
   * Mark report as downloaded
   * POST /api/reports/:reportId/download
   */
  markAsDownloaded = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    const report = await reportService.markAsDownloaded(reportId, userId);

    const response = new ApiResponse(res);
    response.success({
      report: {
        id: report._id,
        isDownloaded: report.isDownloaded,
        downloadCount: report.downloadCount,
        downloadedAt: report.downloadedAt
      }
    }, 'Report marked as downloaded');
  });

  /**
   * Archive report
   * POST /api/reports/:reportId/archive
   */
  archiveReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    const report = await reportService.archiveReport(reportId, userId);

    const response = new ApiResponse(res);
    response.success({
      report: {
        id: report._id,
        isArchived: report.isArchived,
        archivedAt: report.archivedAt
      }
    }, 'Report archived successfully');
  });
}

module.exports = new ReportController();