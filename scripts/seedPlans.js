require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');

const plans = [
  {
    name: '3 Searches Pack',
    price: 49,
    credits: 3,
    isActive: true
  },
  {
    name: '10 Searches Pack',
    price: 99,
    credits: 10,
    isActive: true
  }
];

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Plan.deleteMany({});
    console.log('🗑️  Cleared existing plans');

    const createdPlans = await Plan.insertMany(plans);
    console.log('✅ Seeded plans:');
    createdPlans.forEach(plan => {
      console.log(`   - ${plan.name}: ₹${plan.price} = ${plan.credits} credits`);
    });

    logger.info('Plans seeded successfully', { count: createdPlans.length });
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error.message);
    logger.error('Plan seeding failed', { error: error.message });
    process.exit(1);
  }
}

seedPlans();
