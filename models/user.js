const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters'] ,
        unique: true 
    },
    email: { 
        type: String, 
        required: [true, 'Please enter your email'], 
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be longer than 6 characters'],
        required: true 
    },
    profilePicture: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin'] // you can add more roles as needed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
