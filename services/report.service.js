const { Report, Result } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class ReportService {
  /**
   * Create a report from a result
   * @param {string} resultId - Result ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created report
   */
  async createReportFromResult(resultId, userId) {
    try {
      // Get the result
      const result = await Result.findOne({ _id: resultId, userId });

      if (!result) {
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      // Check if report already exists
      const existingReport = await Report.findBySearchId(result.searchId);
      
      if (existingReport) {
        return existingReport;
      }

      // Create report from result
      const report = await Report.createFromResult(result);

      logger.info('Report created from result', {
        reportId: report._id.toString(),
        resultId: resultId.toString(),
        userId: userId.toString()
      });

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error creating report from result', { 
        error: error.message, 
        resultId,
        userId 
      });
      throw AppError.internal('Failed to create report', 'REPORT_CREATE_FAILED');
    }
  }

  /**
   * Get report by ID
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Report
   */
  async getReportById(reportId, userId) {
    try {
      const report = await Report.findOne({
        _id: reportId,
        userId
      }).populate('searchId', 'searchType nameQuery usernameQuery status createdAt')
        .populate('resultId', 'summary.totalProfilesFound summary.totalImageMatches');

      if (!report) {
        throw AppError.notFound('Report not found', 'REPORT_NOT_FOUND');
      }

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting report', { error: error.message, reportId });
      throw AppError.internal('Failed to get report', 'REPORT_GET_FAILED');
    }
  }

  /**
   * Get report by search ID
   * @param {string} searchId - Search ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Report
   */
  async getReportBySearchId(searchId, userId) {
    try {
      const report = await Report.findOne({
        searchId,
        userId
      }).populate('searchId', 'searchType nameQuery usernameQuery status createdAt')
        .populate('resultId', 'summary.totalProfilesFound summary.totalImageMatches matchedProfiles');

      if (!report) {
        throw AppError.notFound('Report not found', 'REPORT_NOT_FOUND');
      }

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting report by search ID', { error: error.message, searchId });
      throw AppError.internal('Failed to get report', 'REPORT_GET_FAILED');
    }
  }

  /**
   * Get user's reports
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Reports
   */
  async getUserReports(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, includeArchived = false } = options;
      
      const reports = await Report.getUserReports(userId, { limit, skip, includeArchived });
      
      return reports;
    } catch (error) {
      logger.error('Error getting user reports', { error: error.message, userId });
      throw AppError.internal('Failed to get reports', 'REPORTS_GET_FAILED');
    }
  }

  /**
   * Mark report as downloaded
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated report
   */
  async markAsDownloaded(reportId, userId) {
    try {
      const report = await Report.findOne({
        _id: reportId,
        userId
      });

      if (!report) {
        throw AppError.notFound('Report not found', 'REPORT_NOT_FOUND');
      }

      await report.markAsDownloaded();

      logger.info('Report marked as downloaded', {
        reportId: report._id.toString(),
        userId: userId.toString()
      });

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error marking report as downloaded', { 
        error: error.message, 
        reportId 
      });
      throw AppError.internal('Failed to update report', 'REPORT_UPDATE_FAILED');
    }
  }

  /**
   * Archive a report
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated report
   */
  async archiveReport(reportId, userId) {
    try {
      const report = await Report.findOne({
        _id: reportId,
        userId
      });

      if (!report) {
        throw AppError.notFound('Report not found', 'REPORT_NOT_FOUND');
      }

      await report.archive();

      logger.info('Report archived', {
        reportId: report._id.toString(),
        userId: userId.toString()
      });

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error archiving report', { error: error.message, reportId });
      throw AppError.internal('Failed to archive report', 'REPORT_ARCHIVE_FAILED');
    }
  }

  /**
   * Get report statistics (admin only)
   * @returns {Promise<Object>} Statistics
   */
  async getReportStats() {
    try {
      const [total, downloaded, archived] = await Promise.all([
        Report.countDocuments(),
        Report.countDocuments({ isDownloaded: true }),
        Report.countDocuments({ isArchived: true })
      ]);

      return {
        total,
        downloaded,
        archived,
        notDownloaded: total - downloaded,
        active: total - archived
      };
    } catch (error) {
      logger.error('Error getting report stats', { error: error.message });
      throw AppError.internal('Failed to get report stats', 'REPORT_STATS_FAILED');
    }
  }

  /**
   * Get report data as JSON
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Report data
   */
  async getReportData(reportId, userId) {
    try {
      const report = await this.getReportById(reportId, userId);
      
      return {
        reportId: report._id,
        createdAt: report.createdAt,
        data: report.reportData,
        searchInfo: report.reportData?.searchInfo,
        summary: report.reportData?.summary,
        matchedProfiles: report.reportData?.matchedProfiles,
        imageMatches: report.reportData?.imageMatches,
        flags: report.reportData?.flags,
        sources: report.reportData?.sources
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReportService();