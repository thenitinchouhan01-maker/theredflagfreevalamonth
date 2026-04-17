const planService = require('../services/plan.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

class PlanController {
  /**
   * Get all active plans
   * GET /api/plans
   */
  getPlans = asyncHandler(async (req, res) => {
    const plans = await planService.getActivePlans();

    const response = new ApiResponse(res);
    response.success({
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price,
        currency: plan.currency,
        formattedPrice: plan.formattedPrice,
        durationText: plan.durationText,
        description: plan.description,
        features: plan.features,
        isPopular: plan.isPopular
      }))
    });
  });

  /**
   * Get plan by ID
   * GET /api/plans/:planId
   */
  getPlanById = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    
    const plan = await planService.getPlanById(planId);

    const response = new ApiResponse(res);
    response.success({
      plan: {
        id: plan._id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price,
        currency: plan.currency,
        formattedPrice: plan.formattedPrice,
        durationText: plan.durationText,
        description: plan.description,
        features: plan.features,
        isPopular: plan.isPopular,
        createdAt: plan.createdAt
      }
    });
  });
}

module.exports = new PlanController();