const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authUser } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

/**
 * GET /api/categories
 * ดึงรายการหมวดหมู่แบบ Standard และโครงสร้างหมวดหมู่หลัก (ThaiHeritage vs PopCulture: Thailand / International)
 */
router.get('/', async (req, res, next) => {
  try {
    const standardCategories = await Category.find().sort({ name: 1 });

    // โครงสร้างหมวดหมู่แบบกลุ่มตามความต้องการของระบบ Merchroom
    const hierarchy = {
      ThaiHeritage: {
        name: 'Thai Heritage',
        slug: 'thai-heritage',
        description: 'งานหัตถศิลป์ วัฒนธรรม และสินค้าภูมิปัญญาไทยร่วมสมัย',
        subCategories: ['Craft', 'Fashion', 'HomeDecor', 'Textile', 'Ceramics'],
      },
      PopCulture: {
        name: 'Pop Culture',
        slug: 'pop-culture',
        description: 'สินค้าลิขสิทธิ์จากศิลปิน เพลง ภาพยนตร์ และวัฒนธรรมป๊อป',
        subCategories: ['Thailand', 'International'],
      },
    };

    return res.json({
      success: true,
      hierarchy,
      categories: standardCategories,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/categories (Admin Only)
 */
router.post('/', authUser, adminOnly, async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    const category = await Category.create({ name, slug, description });
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
