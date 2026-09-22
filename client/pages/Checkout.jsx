// ----------------------------------------------------------------------
// Checkout Page Dependencies:
// - useState, useEffect: React Hooks สำหรับจัดการ State และ Side-effects
// - useNavigate: Hook จาก react-router-dom สำหรับเปลี่ยนเส้นทางหน้าเว็บ
// - useCart: Custom Hook สำหรับดึงข้อมูลสินค้าในตะกร้า, ฟังก์ชันล้างตะกร้า และอัตราส่วนลด
// - Container, Breadcrumb: UI Components สำหรับจัดเลย์เอาต์และแสดงเส้นทางนำทาง
// ----------------------------------------------------------------------
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../src/context/CartContext';
import Container from '../src/components/ui/Container';
import Breadcrumb from '../src/components/ui/Breadcrumb';
import { createOrder } from '../src/api/orders.api';
import { createCharge } from '../src/api/payments.api';
import { saveOrder } from '../src/utils/orderStorage';

// ค่าจัดส่งแบบคงที่
const DELIVERY_FEE = 15;

const OMISE_PUBLIC_KEY = import.meta.env.VITE_OMISE_PUBLIC_KEY || 'pkey_test_6934r51un8ckfq4d9nj';

function getOmise() {
  if (typeof window !== 'undefined' && window.Omise) {
    window.Omise.setPublicKey(OMISE_PUBLIC_KEY);
  }
  return window.Omise || null;
}

function createOmiseCardToken(cardDetails) {
  const omise = getOmise();
  return new Promise((resolve, reject) => {
    if (!omise) {
      reject(new Error('Omise.js failed to load. Please refresh the page.'));
      return;
    }
    omise.createToken('card', cardDetails, (statusCode, response) => {
      if (statusCode === 200 && response.id) {
        resolve(response.id);
      } else {
        const message = response?.message || response?.data?.message || 'Unable to create card token';
        reject(new Error(message));
      }
    });
  });
}

// ------------- Input Formatting (ช่วยกรอกให้ถูกฟอร์แมต) -------------
// บัตร: กลุ่มเลข 4 หลัก คั่นด้วยช่องว่าง (4242 4242 4242 4242)
function formatCardNumber(value) {
  const digits = value.replace(/\D+/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// หมดอายุ: ฟอร์แมตเป็น MM/YY อัตโนมัติ (12/30)
function formatExpiry(value) {
  const digits = value.replace(/\D+/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ----------------------------------------------------------------------
// buildCheckoutOrder: สร้าง Object คำสั่งซื้อใหม่ (newOrder) ที่ต้นทาง module scope
// - เรียกใช้ Date.now() / new Date() เฉพาะในฟังก์ชันระดับ module เท่านั้น
//   (รูปแบบเดียวกับ helper getOmise/createOmiseCardToken ที่ lint ผ่าน)
// - ฟังก์ชันนี้จะถูกเรียกจาก handleSubmit (event handler) ไม่ใช่ระหว่าง render
// ----------------------------------------------------------------------
function buildCheckoutOrder({
  items,
  total,
  paymentMethod,
  paymentMethodLabel,
  transactionId,
  subtotal,
  discountAmount,
  deliveryFee,
  shippingAddress,
}) {
  return {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    createdAt: new Date().toISOString(),
    status: 'pending',
    deliveryStatus: 'pending',
    paymentStatus: paymentMethod === 'card' && transactionId ? 'paid' : 'pending',
    paymentMethod,
    paymentMethodLabel,
    transactionId,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    totalAmount: total,
    shippingAddress,
    shippingProvider: 'Standard Delivery',
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size || 'M',
      color: item.color || 'Standard',
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    })),
  };
}

const formatCurrency = (val) =>
  `฿${Number(val || 0).toLocaleString('th-TH', {
    minimumFractionDigits: Number(val || 0) % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

export default function Checkout() {
  // Navigation Hook สำหรับย้ายหน้าหลังทำรายการสำเร็จหรือถูกส่งกลับ
  const navigate = useNavigate();

  // ดึงข้อมูลสินค้า (items), ฟังก์ชันล้างตะกร้า (clearCart) และอัตราส่วนลด (discountRate) จาก Cart Context
  const { items, clearCart, discountRate = 0 } = useCart();

  // State เตือน Cart Guard ว่า checkout เสร็จแล้ว (ต้องประกาศก่อน useEffect ที่ใช้ค่าใน deps)
  const [checkoutDone, setCheckoutDone] = useState(false);

  // ----------------------------------------------------------------------
  // Cart Guard: ตรวจสอบความถูกต้องของสินค้าในตะกร้า
  // หากไม่มีสินค้าในตะกร้า (items.length === 0) จะดีดผู้ใช้ออกไปหน้า /cart อัตโนมัติ
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (items.length === 0 && !checkoutDone) {
      navigate('/cart');
    }
  }, [items, navigate, checkoutDone]);

  // ----------------------------------------------------------------------
  // Order Price Calculations (คำนวณราคาสินค้าและค่าจัดส่ง):
  // - subtotal: ยอดรวมราคาสินค้าทุกชิ้นก่อนหักส่วนลด
  // - discountAmount: ยอดเงินที่ได้ส่วนลด (ปัดเศษ)
  // - deliveryFee: ค่าจัดส่ง ($15 หากมีสินค้าในตะกร้า, $0 หากตะกร้าว่าง)
  // - total: ยอดเงินสุทธิตัวสุดท้ายที่ต้องชำระ (ป้องกันค่าน้อยกว่า 0 ด้วย Math.max)
  // ----------------------------------------------------------------------
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * discountRate);
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = Math.max(0, subtotal - discountAmount) + deliveryFee;

  // State สำหรับสวิตช์ Toggle ใช้ที่อยู่จัดส่งเดียวกับที่อยู่อยู่ติดต่อ
  const [useSameAddress, setUseSameAddress] = useState(true);

  // State สำหรับสวิตช์ Toggle บันทึกบัตรเครดิตเป็นค่าเริ่มต้น
  const [saveDefaultCard, setSaveDefaultCard] = useState(false);

  // State สำหรับเลือกประเภทช่องทางการชำระเงิน ('card' | 'promptpay' | 'truemoney' | 'bank')
  const [paymentMethod, setPaymentMethod] = useState('card');

  // State สำหรับการประมวลผลการชำระเงินด้วย Omise
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // State สำหรับเก็บข้อมูลในแบบฟอร์ม (ผู้ติดต่อ, ที่อยู่จัดส่ง, ข้อมูลการชำระเงิน)
  const [formData, setFormData] = useState({
    name: '', email: '', city: '', state: '', zipCode: '', country: '',
    addressLine: '', addressLine2: '', deliveryName: '', deliveryAddressLine: '',
    deliveryAddressLine2: '', deliveryCity: '', deliveryState: '', deliveryZipCode: '',
    deliveryCountry: '', cardName: '', cardNumber: '', expDate: '', cvc: '',
    truemoneyPhone: '', selectedBank: 'SCB', bankAccountNumber: '',
  });

  // Handler จัดการการเปลี่ยนแปลงมูลค่าในอินพุตทุกช่องของฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'cardNumber') next = formatCardNumber(value);
    if (name === 'expDate') next = formatExpiry(value);
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  // ----------------------------------------------------------------------
  // Submit Handler: จัดการการยืนยันคำสั่งซื้อ
  // - หากเลือกบัตรเครดิต/เดบิต จะสร้าง Omise Card Token ฝั่ง client (Public Key)
  //   แล้วส่งไป Backend /api/payments/charge เพื่อเรียกเก็บเงินผ่าน Omise (Secret Key)
  // - สร้าง Object คำสั่งซื้อใหม่ (newOrder) และบันทึกลง localStorage และ Database (MongoDB)
  // - ล้างข้อมูลตะกร้าสินค้า (clearCart) และเปลี่ยนหน้าไปยังหน้าออเดอร์คอนเฟิร์ม
  // ----------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    let transactionId = null;

    if (paymentMethod === 'card') {
      setProcessing(true);
      setPaymentError('');
      try {
        const [expiryMonth, expiryYear] = formData.expDate.split('/');
        const normalizedYear = expiryYear?.length === 2 ? `20${expiryYear}` : (expiryYear || '');
        const card = {
          name: formData.cardName,
          number: formData.cardNumber.replace(/\s+/g, ''),
          expiration_month: expiryMonth || '',
          expiration_year: normalizedYear,
          security_code: formData.cvc,
        };
        const token = await createOmiseCardToken(card);
        const charge = await createCharge({ token, orderId: null, amount: total });
        if (charge?.charge?.id) {
          if (!charge.charge.paid) {
            throw new Error(charge.charge.failureMessage || 'Payment was declined by the bank');
          }
          transactionId = charge.charge.id;
        }
      } catch (error) {
        setProcessing(false);
        setPaymentError(error.message);
        return;
      }
      setProcessing(false);
    }

    const shippingAddress = [
      formData.deliveryName || formData.name,
      formData.deliveryAddressLine || formData.addressLine,
      formData.deliveryCity || formData.city,
      formData.deliveryState || formData.state,
      formData.deliveryZipCode || formData.zipCode,
      formData.deliveryCountry || formData.country
    ].filter(Boolean).join(', ') || 'Default Address';

    // 1. Save to Database (MongoDB backend for Admin panel)
    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.id || item._id,
          quantity: item.quantity,
        })),
        shippingAddress,
        shippingProvider: 'Standard Delivery',
        paymentMethod: paymentMethod,
      };

      await createOrder(orderPayload);
    } catch (error) {
      console.error('Failed to save order to database:', error);
    }

    // 2. สร้างอ็อบเจกต์คำสั่งซื้อใหม่ ผ่าน module-scope helper
    const newOrder = buildCheckoutOrder({
      items,
      total,
      paymentMethod,
      paymentMethodLabel: paymentMethod === 'card' ? 'Credit / Debit Card' : paymentMethod,
      transactionId,
      subtotal,
      discountAmount,
      deliveryFee,
      shippingAddress,
    });

    // บันทึกคำสั่งซื้อลงใน LocalStorage
    saveOrder(newOrder);

    // ป้องกัน Cart Guard ดีดกลับไปหน้า /cart หลังจบการเช็คเอาต์
    setCheckoutDone(true);

    // ล้างตะกร้าสินค้าและนำทางไปหน้าออเดอร์คอนเฟิร์ม
    if (clearCart) clearCart();
    navigate(`/order-confirmation/${newOrder.id}`);
  };

  return (
    <Container className="max-w-[1160px] py-6 md:py-8">
      {/* Breadcrumb นำทาง: Home > Cart > Checkout */}
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

      {/* หัวข้อหน้า Checkout */}
      <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight text-black md:text-3xl leading-none font-integral">
        CHECKOUT
      </h1>

      {/* แบบฟอร์มสั่งซื้อสินค้าหลัก */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 lg:flex-row items-start justify-between">
        
        {/* คอลัมน์ซ้าย: ฟอร์มกรอกข้อมูล 3 ส่วน (ผู้ติดต่อ, ที่อยู่จัดส่ง, การชำระเงิน) */}
        <div className="w-full lg:w-[680px] shrink-0 flex flex-col gap-5">
          
          {/* Section 1: ข้อมูลผู้ติดต่อและที่อยู่หลัก (Contact Information) */}
          <section className="rounded-[20px] border border-black/10 bg-white p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-black">Contact information</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                required
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                  required
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                  required
                />
              </div>
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                required
              />
              <input
                type="text"
                name="addressLine"
                placeholder="Address Line"
                value={formData.addressLine}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                required
              />
              <input
                type="text"
                name="addressLine2"
                placeholder="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
              />
            </div>
          </section>

          {/* Section 2: ข้อมูลสถานที่จัดส่ง (Delivery Details) */}
          <section className="rounded-[20px] border border-black/10 bg-white p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-black">Delivery</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                name="deliveryName"
                placeholder="Name"
                disabled={useSameAddress}
                value={useSameAddress ? formData.name : formData.deliveryName}
                onChange={handleChange}
                className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  name="deliveryAddressLine"
                  placeholder="Address Line"
                  disabled={useSameAddress}
                  value={useSameAddress ? formData.addressLine : formData.deliveryAddressLine}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
                />
                <input
                  type="text"
                  name="deliveryAddressLine2"
                  placeholder="Address Line 2"
                  disabled={useSameAddress}
                  value={useSameAddress ? formData.addressLine2 : formData.deliveryAddressLine2}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  name="deliveryCity"
                  placeholder="City"
                  disabled={useSameAddress}
                  value={useSameAddress ? formData.city : formData.deliveryCity}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
                />
                <input
                  type="text"
                  name="deliveryState"
                  placeholder="State"
                  disabled={useSameAddress}
                  value={useSameAddress ? formData.state : formData.deliveryState}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
                />
                <input
                  type="text"
                  name="deliveryZipCode"
                  placeholder="Zip Code"
                  disabled={useSameAddress}
                  value={useSameAddress ? formData.zipCode : formData.deliveryZipCode}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-black/20"
                />
              </div>

              {/* Toggle Switch: ใช้ที่อยู่เดียวกับผู้ติดต่อ */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium text-black/70">Use same contact address</span>
                <button
                  type="button"
                  onClick={() => setUseSameAddress(!useSameAddress)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    useSameAddress ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                      useSameAddress ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: รายละเอียดการชำระเงิน (Payment Details) */}
          <section className="rounded-[20px] border border-black/10 bg-white p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-black">Payment details</h2>
            
            {/* ตัวเลือกช่องทางการชำระเงิน (Payment Method Selector) */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'card'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-[#F0F0F0] text-black hover:bg-black/5'
                }`}
              >
                <span>Credit / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'promptpay'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-[#F0F0F0] text-black hover:bg-black/5'
                }`}
              >
                <span>QR PromptPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('truemoney')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'truemoney'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-[#F0F0F0] text-black hover:bg-black/5'
                }`}
              >
                <span>TrueMoney</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'bank'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-[#F0F0F0] text-black hover:bg-black/5'
                }`}
              >
                <span>Bank Account</span>
              </button>
            </div>

            {/* ฟอร์มและรายละเอียดการชำระเงินตามประเภทที่เลือก */}
            <div className="mt-4 flex flex-col gap-3">
              {/* 1. Credit / Debit Card */}
              {paymentMethod === 'card' && (
                <>
                  <input
                    type="text"
                    name="cardName"
                    placeholder="Cardholder Name"
                    value={formData.cardName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                    required={paymentMethod === 'card'}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px_90px]">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                      required={paymentMethod === 'card'}
                    />
                    <input
                      type="text"
                      name="expDate"
                      placeholder="MM/YY"
                      value={formData.expDate}
                      onChange={handleChange}
                      className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-center text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                      required={paymentMethod === 'card'}
                    />
                    <input
                      type="text"
                      name="cvc"
                      placeholder="CVC"
                      value={formData.cvc}
                      onChange={handleChange}
                      className="h-11 rounded-xl bg-[#F0F0F0] px-4 text-center text-sm outline-none placeholder:text-black/40 focus:bg-white focus:ring-1 focus:ring-black/20"
                      required={paymentMethod === 'card'}
                    />
                  </div>

                  {/* Toggle Switch: บันทึกบัตรชำระเงินเป็นค่าเริ่มต้น */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium text-black/70">Save this card as default payment method</span>
                    <button
                      type="button"
                      onClick={() => setSaveDefaultCard(!saveDefaultCard)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        saveDefaultCard ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                          saveDefaultCard ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              {/* 2. QR PromptPay (Mock) */}
              {paymentMethod === 'promptpay' && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F0F0F0] p-6 text-center">
                  <p className="text-sm font-bold text-black">Scan QR Code to Pay</p>
                  <p className="mt-1 text-xs text-black/60">รองรับ Mobile Banking ทุกธนาคาร</p>
                  <div className="mt-4 flex size-44 items-center justify-center rounded-2xl border border-black/10 bg-white p-2 shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PROMPTPAY_MOCK_TOTAL_${total}`}
                      alt="PromptPay QR Code"
                      className="size-full object-contain"
                    />
                  </div>
                  <p className="mt-4 text-xs font-bold text-black/80">ยอดชำระสุทธิ: {formatCurrency(total)}</p>
                </div>
              )}

              {/* 3. TrueMoney Wallet */}
              {paymentMethod === 'truemoney' && (
                <div className="flex flex-col gap-3 rounded-2xl bg-[#F0F0F0] p-5 md:p-6">
                  <p className="text-xs font-bold text-black/80">ชำระผ่าน TrueMoney Wallet</p>
                  <input
                    type="tel"
                    name="truemoneyPhone"
                    placeholder="เบอร์โทรศัพท์ที่ผูกกับ TrueMoney Wallet (10 หลัก)"
                    value={formData.truemoneyPhone}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl bg-white px-4 text-sm outline-none placeholder:text-black/40 focus:ring-1 focus:ring-black/20"
                    required={paymentMethod === 'truemoney'}
                  />
                  <p className="text-[11px] text-black/50">* ระบบจะส่งข้อความแจ้งเตือนไปยังแอป TrueMoney เพื่อยืนยันการชำระเงิน</p>
                </div>
              )}

              {/* 4. Thai Bank Account Direct Link */}
              {paymentMethod === 'bank' && (
                <div className="flex flex-col gap-3 rounded-2xl bg-[#F0F0F0] p-5 md:p-6">
                  <p className="text-xs font-bold text-black/80">ผูกบัญชีธนาคาร (Direct Bank Debit)</p>
                  <select
                    name="selectedBank"
                    value={formData.selectedBank}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl bg-white px-4 text-sm outline-none focus:ring-1 focus:ring-black/20 text-black cursor-pointer"
                  >
                    <option value="SCB">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="KBANK">ธนาคารกสิกรไทย (KBank)</option>
                    <option value="KTB">ธนาคารกรุงไทย (Krungthai)</option>
                    <option value="BBL">ธนาคารกรุงเทพ (Bangkok Bank)</option>
                    <option value="TTB">ธนาคารทหารไทยธนชาต (ttb)</option>
                    <option value="BAY">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                  </select>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    placeholder="เลขที่บัญชีธนาคาร"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl bg-white px-4 text-sm outline-none placeholder:text-black/40 focus:ring-1 focus:ring-black/20"
                    required={paymentMethod === 'bank'}
                  />
                  <p className="text-[11px] text-black/50">* ระบบจะนำคุณไปยังหน้า Mobile Banking ของธนาคารที่เลือกเพื่อยืนยันการผูกบัญชี</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* คอลัมน์ขวา: สรุปรายการสั่งซื้อและยอดเงินทั้งหมด (Order Summary) */}
        <aside className="w-full lg:w-[440px] shrink-0 rounded-[20px] border border-black/10 bg-white p-5 md:p-6" aria-label="Order Summary">
          <h2 className="text-lg md:text-xl font-bold text-black">Order Summary</h2>

          {/* รายการสินค้าย่อยในตะกร้า (Mini Items List) */}
          <div className="mt-4 max-h-[220px] overflow-y-auto divide-y divide-black/10 pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2.5">
                <div className="size-12 shrink-0 overflow-hidden rounded-md bg-[#F0F0F0]">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs md:text-sm font-bold text-black">{item.name}</p>
                  <p className="text-xs text-black/60">Qty: {item.quantity}</p>
                </div>
                <p className="text-xs md:text-sm font-bold text-black">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-black/10" />

          {/* ตารางแสดงสรุปราคา (Subtotal, Discount, Delivery Fee) */}
          <dl className="flex flex-col gap-3 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <dt className="text-black/60">Subtotal</dt>
              <dd className="font-bold text-black">{formatCurrency(subtotal)}</dd>
            </div>

            {/* แสดงส่วนลดเฉพาะกรณีที่มีส่วนลดมากกว่า 0 */}
            {discountRate > 0 && (
              <div className="flex justify-between items-center text-[#FF3333]">
                <dt>Discount (-{Math.round(discountRate * 100)}%)</dt>
                <dd className="font-bold">-{formatCurrency(discountAmount)}</dd>
              </div>
            )}

            <div className="flex justify-between items-center">
              <dt className="text-black/60">Delivery Fee</dt>
              <dd className="font-bold text-black">{formatCurrency(deliveryFee)}</dd>
            </div>
          </dl>

          <div className="my-4 border-t border-black/10" />

          {/* ราคารวมสุทธิ (Total) */}
          <div className="flex justify-between items-center text-base md:text-lg font-bold text-black">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {/* ปุ่มยืนยันการสั่งซื้อ */}
          {paymentError && (
            <p className="mt-3 text-center text-sm font-medium text-[#FF3333]">{paymentError}</p>
          )}
          <button
            type="submit"
            disabled={processing}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? 'Processing payment...' : 'Finish checkout'}
          </button>
        </aside>
      </form>
    </Container>
  );
}
