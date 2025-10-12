const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    type: {
        type: String,
        required: [true, 'Category type is required'],
        enum: ['income', 'expense'],
        lowercase: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
