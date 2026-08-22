const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Mongoose 8 uses these defaults, but being explicit for clarity
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✓ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      retries++;
      console.error(
        `✗ MongoDB connection attempt ${retries}/${maxRetries} failed:`,
        error.message
      );

      if (retries === maxRetries) {
        console.error('✗ Max retries reached. Exiting.');
        process.exit(1);
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, retries) * 1000;
      console.log(`  Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
