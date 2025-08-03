require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const QRCode = require('qrcode');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fftopup', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Database models
const Order = require('./models/Order');
const Product = require('./models/Product');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate DANA payment link
app.get('/api/payment/dana', async (req, res) => {
    const { amount, orderId } = req.query;
    
    try {
        // In a real implementation, you would generate a proper DANA payment link
        const paymentLink = `https://link.dana.id/minta?amount=${amount}&orderId=${orderId}`;
        
        // Save payment request to database
        await Order.updateOne(
            { orderId },
            { $set: { paymentMethod: 'DANA', amount, status: 'pending' } },
            { upsert: true }
        );
        
        res.json({ paymentLink });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate QRIS payment
app.get('/api/payment/qris', async (req, res) => {
    const { amount, orderId } = req.query;
    
    try {
        // Generate QRIS data
        const qrisData = `00020101021226680014ID.CO.QRIS.WWW011893600911000000000000021520000000000000303UMI51440014ID.CO.QRIS.WWW0215ID12345678901230303UMI5204581253033605802ID5914MERCHANT NAME6013JAKARTA PUSAT6105101406230012345678902163A9B4C`;
        
        // Generate QR code image
        const qrCodeUrl = await QRCode.toDataURL(qrisData);
        
        // Save payment request to database
        await Order.updateOne(
            { orderId },
            { $set: { paymentMethod: 'QRIS', amount, status: 'pending' } },
            { upsert: true }
        );
        
        res.json({ qrCodeUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Confirm payment
app.post('/api/orders/confirm', async (req, res) => {
    try {
        const { orderId, package, gameId, nickname, paymentMethod, paymentProof, senderName, paymentTime } = req.body;
        
        // Save order to database
        const order = new Order({
            orderId,
            package,
            gameId,
            nickname,
            paymentMethod,
            paymentProof,
            senderName,
            paymentTime,
            status: 'pending'
        });
        
        await order.save();
        
        // In a real implementation, you would verify the payment with payment gateway
        // For demo purposes, we'll simulate verification
        setTimeout(async () => {
            await Order.updateOne(
                { orderId },
                { $set: { status: 'completed', processedAt: new Date() } }
            );
        }, 5000);
        
        res.json({ 
            success: true,
            message: 'Payment confirmation received. Your order is being processed.'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
});

// Check order status
app.get('/api/orders/:orderId/status', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({
            status: order.status,
            order: order
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send email notification
app.post('/api/notifications/email', async (req, res) => {
    try {
        const { to, subject, message } = req.body;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: message
        };
        
        await transporter.sendMail(mailOptions);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
});

// Send WhatsApp notification
app.post('/api/notifications/whatsapp', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        await twilioClient.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:+${to}`
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
