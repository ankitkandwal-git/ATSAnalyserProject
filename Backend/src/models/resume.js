import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    filename : String,
    resumeUrl : String,
    extractedText : String,
    analysisJobId : String,
    analysisHash : String,
    analysisStatus : {
        type: String,
        enum: ['uploaded', 'queued', 'processing', 'completed', 'failed'],
        default: 'uploaded'
    },
    analysisResult : mongoose.Schema.Types.Mixed,
    analysisError : String,
    analysisCompletedAt : Date,
    uploadDate : { type: Date, default: Date.now }
})

export default mongoose.model('Resume', resumeSchema);