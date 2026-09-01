const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not configured');
        }

        const serverSelectionTimeoutMS = Number(process.env.MONGO_CONNECTION_TIMEOUT_MS) || 30000;
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Atlas discovery and TLS negotiation may exceed five seconds on
            // the first connection or on slower networks.
            serverSelectionTimeoutMS,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
