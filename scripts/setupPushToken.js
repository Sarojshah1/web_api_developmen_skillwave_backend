const mongoose = require('mongoose');
const User = require('../models/usersmodel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function setupPushToken() {
  try {
    // Get all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Push Token: ${user.pushToken || 'NOT SET'}`);
    });

    // For testing, let's set a test push token for the first user
    const testUser = users[0];
    const testPushToken = 'ExponentPushToken[test_token_for_development]';
    
    console.log(`\nSetting test push token for user: ${testUser.name}`);
    
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      { pushToken: testPushToken },
      { new: true }
    );

    if (updatedUser) {
      console.log(`✅ Push token set successfully for ${updatedUser.name}`);
      console.log(`Push Token: ${updatedUser.pushToken}`);
      console.log(`\nYou can now test notifications with user ID: ${updatedUser._id}`);
    } else {
      console.log('❌ Failed to update push token');
    }

  } catch (error) {
    console.error('Error setting up push token:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the setup
setupPushToken(); 