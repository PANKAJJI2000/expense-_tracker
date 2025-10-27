const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 60000, // Increase to 60 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 60000,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    
    // Provide helpful error messages
    if (error.name === 'MongoNetworkTimeoutError') {
      console.error('Possible causes:');
      console.error('1. MongoDB server is not running');
      console.error('2. Network firewall blocking connection');
      console.error('3. MongoDB Atlas IP whitelist not configured');
      console.error('4. Incorrect connection string');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
