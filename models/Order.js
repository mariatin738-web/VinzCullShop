const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    package: {
        diamonds: Number,
        price: Number,
        id: String
    },
    gameId: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentProof: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    paymentTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    processedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
