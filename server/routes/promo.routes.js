const express = require('express');
const PromoCode = require('../models/PromoCode');

const router = express.Router();

/**
 * GET /api/promos
 * ดึงรายการโปรโมโค้ดที่เปิดใช้งานอยู่
 */
router.get('/', async (req, res, next) => {
  try {
    const promos = await PromoCode.find({ isActive: true }).select('code discountPercent description');
    return res.json({ success: true, data: promos });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/promos/validate
 * ตรวจสอบความถูกต้องและคำนวณมูลค่าส่วนลด
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Promo code is required' });
    }

    const promo = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promo code' });
    }

    const discountAmount = Math.round(Number(subtotal) * promo.discountPercent);

    return res.json({
      success: true,
      message: `Code applied: ${(promo.discountPercent * 100).toFixed(0)}% OFF`,
      data: {
        code: promo.code,
        discountPercent: promo.discountPercent,
        discountAmount,
        newTotal: Math.max(0, Number(subtotal) - discountAmount),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
