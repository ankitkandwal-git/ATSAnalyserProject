import mongoose from 'mongoose';

const connectDB = async () =>{
    try{
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

        if (!mongoUri) {
            throw new Error('MongoDB connection string is missing. Set MONGO_URI or MONGO_URL.');
        }

        await mongoose.connect(mongoUri)
        console.log('✓ MongoDB connected successfully');
    }catch(error){
        console.error('✗ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

export default connectDB;