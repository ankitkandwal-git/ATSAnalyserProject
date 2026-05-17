import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    filename : String,
    resumeUrl : String,
    uploadDate : { type: Date, default: Date.now }
})

export default mongoose.model('Resume', resumeSchema);