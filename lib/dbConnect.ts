import mongoose from 'mongoose';

// Centralized MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

// Connection options for better performance and reliability
const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

// Type definitions for better type safety
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache to reuse an existing connection
let cached: CachedConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to MongoDB with caching and error handling
 * @returns Promise<typeof mongoose> - The mongoose connection instance
 * @throws Error if connection fails or MONGODB_URI is not defined
 */
async function dbConnect(): Promise<typeof mongoose> {
  try {
    // Return existing connection if available
    if (cached.conn) {
      return cached.conn;
    }

    // Create new connection if none exists
    if (!cached.promise) {
      cached.promise = mongoose
        .connect(MONGODB_URI, connectionOptions)
        .then((mongoose) => {
          console.log('✅ MongoDB connected successfully');
          return mongoose;
        })
        .catch((error) => {
          console.error('❌ MongoDB connection failed:', error);
          cached.promise = null; // Reset promise on error
          throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gracefully closes the MongoDB connection
 * @returns Promise<void>
 */
async function dbDisconnect(): Promise<void> {
  try {
    if (cached.conn) {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.log('✅ MongoDB disconnected successfully');
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

export default dbConnect;
export { dbDisconnect, connectionOptions }; 