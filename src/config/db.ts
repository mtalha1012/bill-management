import mongoose from 'mongoose';
import { getEnv } from './env.js';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(getEnv('MONGO_URI'));
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database Connection Error: ${message}`);
    process.exit(1);
  }
};

export default connectDB;
