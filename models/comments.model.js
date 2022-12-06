const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Comment' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
