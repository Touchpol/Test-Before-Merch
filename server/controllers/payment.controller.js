const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { method = 'PromptPay' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      payment = await Payment.create({
        orderId,
        amount: order.totalAmount,
        method,
        status: 'pending'
      });
    }

    res.json({
      success: true,
      message: 'Payment intent created / PromptPay QR generated',
      payment,
      qrCodeUrl: `https://api.promptpay.io/qr/${order.totalAmount}?ref=${order._id}`
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const { orderId, paymentId, status = 'paid' } = req.body;
    let payment = null;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else if (orderId) {
      payment = await Payment.findOne({ orderId });
    }

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = status;
    await payment.save();

    if (status === 'paid') {
      await Order.findByIdAndUpdate(payment.orderId, { status: 'processing' });
    }

    res.json({ success: true, message: 'Webhook processed successfully', payment });
  } catch (error) {
    next(error);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'refunded';
    await payment.save();
    await Order.findByIdAndUpdate(payment.orderId, { status: 'cancelled' });

    res.json({ success: true, message: 'Refund processed successfully', payment });
  } catch (error) {
    next(error);
  }
};
