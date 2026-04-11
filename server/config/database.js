import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Assurez-vous que dotenv est configuré
dotenv.config();

class Database {
    constructor() {
        // Debug - Affichez la valeur brute
        console.log('Raw MONGO_URI:', JSON.stringify(process.env.MONGO_URI));
        console.log('Type of MONGO_URI:', typeof process.env.MONGO_URI);
        console.log('Length:', process.env.MONGO_URI?.length);

        // Nettoyez la chaîne (enlève les guillemets, espaces, etc.)
        this.uri = process.env.MONGO_URI?.trim().replace(/^["']|["']$/g, '');

        this.options = {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000
        };
    }

    async connect() {
        if (!this.uri) {
            console.error('❌ MONGO_URI is empty or undefined');
            console.log('Available env vars:', Object.keys(process.env));
            process.exit(1);
        }

        try {
            await mongoose.connect(this.uri, this.options);
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`📍 Host: ${mongoose.connection.host}`);
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            console.error('Attempted URI:', this.uri.substring(0, 50) + '...');
            process.exit(1);
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('MongoDB disconnected');
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    // Pour les health checks
    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

export default new Database(); // Singleton