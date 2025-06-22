process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/usersmodel');
const Category = require('../models/categorymodel');
const Course = require('../models/coursemodel');
const { app, server, io } = require('../index');

const testUser = {
  name: 'Course Tester',
  email: 'coursetester@example.com',
  password: 'coursetest123',
  role: 'tutor',
};

let authToken;
let userId;
let categoryId;
let courseId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  // Clean up any existing test data
  await User.deleteOne({ email: testUser.email });
  await Category.deleteMany({ name: { $in: ['Test Category for Course'] } });
  await Course.deleteMany({ title: { $in: ['Test Course', 'Updated Test Course'] } });
  
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
    .field('name', 'Test Category for Course')
    .field('description', 'Test category for course testing')
    .attach('icon', path.join(__dirname, 'test-assets/test.png'));
  categoryId = categoryRes.body._id;
});

afterAll(async () => {
  // Clean up test data
  await Course.deleteMany({ title: { $in: ['Test Course', 'Updated Test Course'] } });
  await Category.deleteMany({ name: { $in: ['Test Category for Course'] } });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Course API', () => {
  test('should create a new course', async () => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test Course')
      .field('description', 'Test course description')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Course');
    expect(res.body.description).toBe('Test course description');
    expect(res.body.price).toBe(99.99);
    expect(res.body.duration).toBe('10 hours');
    expect(res.body.level).toBe('beginner');
    expect(res.body).toHaveProperty('thumbnail');
    courseId = res.body._id;
  });

  test('should not create course without authentication', async () => {
    const res = await request(app)
      .post('/api/courses/')
      .field('title', 'Test Course No Auth')
      .field('description', 'Test course without auth')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(401);
  });

  test('should get all courses', async () => {
    const res = await request(app).get('/api/courses/');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get courses with pagination', async () => {
    const res = await request(app).get('/api/courses/pagination?page=1&limit=5');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('totalCourses');
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.courses)).toBe(true);
  });

  test('should get a course by id', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', courseId);
    expect(res.body.title).toBe('Test Course');
  });

  test('should not get course by id without authentication', async () => {
    const res = await request(app).get(`/api/courses/${courseId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent course', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should get courses by creator', async () => {
    const res = await request(app)
      .get('/api/courses/creator')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get courses by creator without authentication', async () => {
    const res = await request(app).get('/api/courses/creator');
    
    expect(res.statusCode).toBe(401);
  });

  test('should get courses by category', async () => {
    const res = await request(app)
      .get(`/api/courses/category/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should return 404 for non-existent category courses', async () => {
    const fakeCategoryId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/courses/category/${fakeCategoryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('No courses found for this category');
  });

  test('should update a course', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        title: 'Updated Test Course',
        description: 'Updated course description',
        price: 149.99,
        level: 'intermediate'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Test Course');
    expect(res.body.description).toBe('Updated course description');
    expect(res.body.price).toBe(149.99);
    expect(res.body.level).toBe('intermediate');
  });

  test('should not update course without authentication', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .send({ title: 'Unauthorized Update' });
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent course', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Non-existent Course' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should delete a course', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Course deleted successfully');
  });

  test('should not delete course without authentication', async () => {
    const res = await request(app).delete(`/api/courses/${courseId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted course', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should return 404 when deleting non-existent course', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });
}); 