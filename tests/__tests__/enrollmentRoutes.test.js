process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/usersmodel');
const Category = require('../models/categorymodel');
const Course = require('../models/coursemodel');
const Enrollment = require('../models/enrollmentmodel');
const { app, server, io } = require('../index');

const testUser = {
  name: 'Enrollment Tester',
  email: 'enrollmenttester@example.com',
  password: 'enrollmenttest123',
  role: 'student',
};

let authToken;
let userId;
let categoryId;
let courseId;
let enrollmentId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  // Clean up any existing test data
  await User.deleteOne({ email: testUser.email });
  await Category.deleteMany({ name: { $in: ['Test Category for Enrollment'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Enrollment'] } });
  await Enrollment.deleteMany({ user_id: { $exists: true } });
  
  // Register user
  await request(app)
    .post('/api/user/register')
    .field('name', testUser.name)
    .field('email', testUser.email)
    .field('password', testUser.password)
    .field('role', testUser.role)
    .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
  
  // Login user
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: testUser.email, password: testUser.password });
  authToken = loginRes.body.token;
  userId = loginRes.body.id;
  
  // Create a test category
  const categoryRes = await request(app)
    .post('/api/category/')
    .field('name', 'Test Category for Enrollment')
    .field('description', 'Test category for enrollment testing')
    .attach('icon', path.join(__dirname, 'test-assets/test.png'));
  categoryId = categoryRes.body._id;
  
  // Create a test course
  const courseRes = await request(app)
    .post('/api/courses/')
    .set('Authorization', `Bearer ${authToken}`)
    .field('title', 'Test Course for Enrollment')
    .field('description', 'Test course for enrollment testing')
    .field('category_id', categoryId)
    .field('price', '99.99')
    .field('duration', '10 hours')
    .field('level', 'beginner')
    .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
  courseId = courseRes.body._id;
});

afterAll(async () => {
  // Clean up test data
  await Enrollment.deleteMany({ user_id: { $exists: true } });
  await Course.deleteMany({ title: { $in: ['Test Course for Enrollment'] } });
  await Category.deleteMany({ name: { $in: ['Test Category for Enrollment'] } });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Enrollment API', () => {
  test('should create a new enrollment', async () => {
    const res = await request(app)
      .post('/api/enroll/')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        course_id: courseId
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.user_id).toBe(userId);
    expect(res.body.course_id).toBe(courseId);
    expect(res.body.status).toBe('in-progress');
    expect(res.body.progress).toBe(0);
    enrollmentId = res.body._id;
  });

  test('should not create enrollment without authentication', async () => {
    const res = await request(app)
      .post('/api/enroll/')
      .send({
        course_id: courseId
      });
    
    expect(res.statusCode).toBe(401);
  });

  test('should get user enrollments', async () => {
    const res = await request(app)
      .get('/api/enroll/user')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get user enrollments without authentication', async () => {
    const res = await request(app).get('/api/enroll/user');
    
    expect(res.statusCode).toBe(401);
  });

  test('should update enrollment progress', async () => {
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        progress: 50
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.progress).toBe(50);
    expect(res.body.status).toBe('in-progress');
  });

  test('should complete enrollment when progress reaches 100', async () => {
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        progress: 100
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.progress).toBe(100);
    expect(res.body.status).toBe('completed');
    expect(res.body).toHaveProperty('completed_at');
  });

  test('should not update enrollment without authentication', async () => {
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .send({ progress: 75 });
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent enrollment', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/enroll/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ progress: 50 });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Enrollment not found');
  });

  test('should delete an enrollment', async () => {
    const res = await request(app)
      .delete(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Enrollment deleted successfully');
  });

  test('should not delete enrollment without authentication', async () => {
    const res = await request(app).delete(`/api/enroll/${enrollmentId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when deleting non-existent enrollment', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/enroll/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Enrollment not found');
  });

  test('should return empty array for user enrollments after deletion', async () => {
    const res = await request(app)
      .get('/api/enroll/user')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
}); 