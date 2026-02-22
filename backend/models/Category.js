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
    },
    icon: {
        type: String,
        trim: true,
        default: '📁'
    },
    color: {
        type: String,
        trim: true,
        default: '#6366f1'
    },
    budgetLimit: {
        type: Number,
        default: 0,
        min: [0, 'Budget limit cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
categorySchema.index({ type: 1, isActive: 1 });
categorySchema.index({ name: 'text' });

module.exports = mongoose.model('Category', categorySchema);
