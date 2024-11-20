const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'premium', 'user', 'guest'],
        default: 'guest'
    },
    premiumExpiration: {
        type: Date,
        default: Date.now()
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    CreatedAt: {
        type: Date,
        default: Date.now()
    },
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;