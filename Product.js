const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    diamonds: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
