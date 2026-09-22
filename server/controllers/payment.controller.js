const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29',
});

const Order = require('../models/Order');
const Payment = require('../models/Payment');

exports.createCharge = async (req, res, next) => {
  try {
    const { token, orderId, amount } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Omise card token is required' });

    const bahtAmount = Math.round(Number(amount));
    if (!Number.isFinite(bahtAmount) || bahtAmount < 20) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 20 THB' });
    }

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (order && req.user && String(order.userId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'You cannot pay for this order' });
      }
    }

    const charge = await omise.charges.create({
      amount: bahtAmount * 100,
      currency: 'thb',
      card: token,
      description: `Merchroom order ${orderId || 'test-payment'}`,
    });

    let payment = null;
    if (order) {
      const brand = charge.card ? ` (${charge.card.brand})` : '';
      payment = await Payment.findOneAndUpdate(
        { orderId: order._id },
        {
          $set: {
            amount: charge.amount,
            method: `card${brand}`,
            status: charge.paid ? 'paid' : 'failed',
            transactionId: charge.id,
          },
        },
        { new: true, runValidators: true },
      );
    }

    return res.json({
      success: true,
      charge: {
        id: charge.id,
        status: charge.status,
        paid: charge.paid,
        amount: charge.amount,
        currency: charge.currency,
        failureCode: charge.failure_code || null,
        failureMessage: charge.failure_message || null,
      },
      payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Payment failed',
      code: error.code || null,
    });
  }
};

exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};