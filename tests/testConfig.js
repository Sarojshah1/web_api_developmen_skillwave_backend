// Test configuration to ensure tests don't touch the main database
const mongoose = require('mongoose');

// Test database configuration
const TEST_DB_URI = 'mongodb://localhost:27017/e-learning-test';

// Connect to test database
const connectTestDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to test database');
    }
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
};

// Disconnect from test database
const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Disconnected from test database');
    }
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
};

// Clean test database
const cleanTestDB = async () => {
  try {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    console.log('Test database cleaned');
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
};

module.exports = {
  TEST_DB_URI,
  connectTestDB,
  disconnectTestDB,
  cleanTestDB
}; 