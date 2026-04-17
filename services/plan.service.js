const { Plan } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class PlanService {
  /**
   * Get all active plans
   * @returns {Promise<Array>} List of active plans
   */
  async getActivePlans() {
    try {
      const plans = await Plan.getActivePlans();
      return plans;
    } catch (error) {
      logger.error('Error getting active plans', { error: error.message });
      throw AppError.internal('Failed to get plans', 'PLANS_GET_FAILED');
    }
  }

  /**
   * Get plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Plan
   */
  async getPlanById(planId) {
    try {
      const plan = await Plan.findById(planId);

      if (!plan) {
        throw AppError.notFound('Plan not found', 'PLAN_NOT_FOUND');
      }

      if (!plan.isActive) {
        throw AppError.badRequest('Plan is not active', 'PLAN_INACTIVE');
      }

      return plan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting plan by ID', { error: error.message, planId });
      throw AppError.internal('Failed to get plan', 'PLAN_GET_FAILED');
    }
  }

  /**
   * Get plan by ID (internal use, no active check)
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Plan
   */
  async getPlanByIdInternal(planId) {
    try {
      const plan = await Plan.findById(planId);

      if (!plan) {
        throw AppError.notFound('Plan not found', 'PLAN_NOT_FOUND');
      }

      return plan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting plan internally', { error: error.message, planId });
      throw AppError.internal('Failed to get plan', 'PLAN_GET_FAILED');
    }
  }

  /**
   * Seed default plans
   * @returns {Promise<void>}
   */
  async seedPlans() {
    try {
      await Plan.seedDefaultPlans();
    } catch (error) {
      logger.error('Error seeding plans', { error: error.message });
      throw AppError.internal('Failed to seed plans', 'PLANS_SEED_FAILED');
    }
  }

  /**
   * Create a new plan (admin only)
   * @param {Object} planData - Plan data
   * @returns {Promise<Object>} Created plan
   */
  async createPlan(planData) {
    try {
      const plan = await Plan.create(planData);
      
      logger.info('Plan created', { 
        planId: plan._id.toString(),
        name: plan.name 
      });

      return plan;
    } catch (error) {
      logger.error('Error creating plan', { error: error.message });
      throw AppError.internal('Failed to create plan', 'PLAN_CREATE_FAILED');
    }
  }

  /**
   * Update a plan (admin only)
   * @param {string} planId - Plan ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated plan
   */
  async updatePlan(planId, updateData) {
    try {
      const plan = await Plan.findByIdAndUpdate(
        planId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!plan) {
        throw AppError.notFound('Plan not found', 'PLAN_NOT_FOUND');
      }

      logger.info('Plan updated', { planId: plan._id.toString() });

      return plan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error updating plan', { error: error.message, planId });
      throw AppError.internal('Failed to update plan', 'PLAN_UPDATE_FAILED');
    }
  }

  /**
   * Delete a plan (admin only - soft delete)
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async deletePlan(planId) {
    try {
      const plan = await Plan.findByIdAndUpdate(
        planId,
        { isActive: false },
        { new: true }
      );

      if (!plan) {
        throw AppError.notFound('Plan not found', 'PLAN_NOT_FOUND');
      }

      logger.info('Plan deactivated', { planId: plan._id.toString() });
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error deleting plan', { error: error.message, planId });
      throw AppError.internal('Failed to delete plan', 'PLAN_DELETE_FAILED');
    }
  }
}

module.exports = new PlanService();