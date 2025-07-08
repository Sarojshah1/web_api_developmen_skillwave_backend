const mongoose = require('mongoose');
const User = require('../models/usersmodel');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testNotifications() {
  try {
    // Get the first user (we set up push token for this user)
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found');
      return;
    }

    console.log(`Testing with user: ${user.name} (${user.email})`);
    console.log(`Push Token: ${user.pushToken || 'NOT SET'}`);

    // For testing purposes, let's create a simple login simulation
    // In a real scenario, you would get the JWT token from your login endpoint
    console.log('\n=== Testing Push Token Status ===');
    
    // Note: You'll need to replace 'YOUR_JWT_TOKEN' with an actual token from your login endpoint
    console.log('To test the API endpoints, you need to:');
    console.log('1. Login to get a JWT token');
    console.log('2. Use that token in the Authorization header');
    
    console.log('\n=== Manual Testing Steps ===');
    console.log('1. Login to get JWT token:');
    console.log(`   POST ${BASE_URL}/user/login`);
    console.log('   Body: { "email": "sarojahah152@gmail.com", "password": "your_password" }');
    
    console.log('\n2. Check push token status:');
    console.log(`   GET ${BASE_URL}/notifications/push-token-status`);
    console.log('   Headers: { "Authorization": "Bearer YOUR_JWT_TOKEN" }');
    
    console.log('\n3. Test push notification:');
    console.log(`   POST ${BASE_URL}/notifications/test`);
    console.log('   Headers: { "Authorization": "Bearer YOUR_JWT_TOKEN" }');
    console.log('   Body: { "title": "Test Call", "body": "This is a test notification" }');
    
    console.log('\n4. Update push token:');
    console.log(`   PUT ${BASE_URL}/notifications/push-token`);
    console.log('   Headers: { "Authorization": "Bearer YOUR_JWT_TOKEN" }');
    console.log('   Body: { "pushToken": "ExponentPushToken[your_actual_token]" }');

    console.log('\n=== Current User Info ===');
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Push Token Set: ${!!user.pushToken}`);
    console.log(`Push Token: ${user.pushToken || 'None'}`);

  } catch (error) {
    console.error('Error testing notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testNotifications(); 