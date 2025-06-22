process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/usersmodel');
const Category = require('../models/categorymodel');
const Course = require('../models/coursemodel');
const Review = require('../models/review');
const { app, server, io } = require('../index');

const testUser = {
  name: 'Review Tester',
  email: 'reviewtester@example.com',
  password: 'reviewtest123',
  role: 'student',
};

let authToken;
let userId;
let categoryId;
let courseId;
let reviewId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  // Clean up any existing test data
  await User.deleteOne({ email: testUser.email });
  await Category.deleteMany({ name: { $in: ['Test Category for Review'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Review'] } });
  await Review.deleteMany({ comment: { $in: ['Test Review Comment', 'Updated Test Review Comment'] } });
  
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
    .field('name', 'Test Category for Review')
    .field('description', 'Test category for review testing')
    .attach('icon', path.join(__dirname, 'test-assets/test.png'));
  categoryId = categoryRes.body._id;
  
  // Create a test course
  const courseRes = await request(app)
    .post('/api/courses/')
    .set('Authorization', `Bearer ${authToken}`)
    .field('title', 'Test Course for Review')
    .field('description', 'Test course for review testing')
    .field('category_id', categoryId)
    .field('price', '99.99')
    .field('duration', '10 hours')
    .field('level', 'beginner')
    .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
  courseId = courseRes.body._id;
});

afterAll(async () => {
  // Clean up test data
  await Review.deleteMany({ comment: { $in: ['Test Review Comment', 'Updated Test Review Comment'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Review'] } });
  await Category.deleteMany({ name: { $in: ['Test Category for Review'] } });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Review API', () => {
  test('should create a new review', async () => {
    const res = await request(app)
      .post('/api/review/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        course_id: courseId,
        rating: 5,
        comment: 'Test Review Comment'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Test Review Comment');
    expect(res.body).toHaveProperty('user_id');
    expect(res.body).toHaveProperty('course_id');
    reviewId = res.body._id;
  });

  test('should not create review without authentication', async () => {
    const res = await request(app)
      .post('/api/review/reviews')
      .send({
        course_id: courseId,
        rating: 4,
        comment: 'Test Review No Auth'
      });
    
    expect(res.statusCode).toBe(401);
  });

  test('should get all reviews', async () => {
    const res = await request(app)
      .get('/api/review/reviews')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all reviews without authentication', async () => {
    const res = await request(app).get('/api/review/reviews');
    
    expect(res.statusCode).toBe(401);
  });

  test('should get a review by id', async () => {
    const res = await request(app)
      .get(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', reviewId);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Test Review Comment');
  });

  test('should not get review by id without authentication', async () => {
    const res = await request(app).get(`/api/review/reviews/${reviewId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent review', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should get reviews by course id', async () => {
    const res = await request(app)
      .get(`/api/review/reviews/course/${courseId}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should return 404 for course with no reviews', async () => {
    const fakeCourseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/review/reviews/course/${fakeCourseId}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('No reviews found for this course');
  });

  test('should update a review', async () => {
    const res = await request(app)
      .put(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        rating: 4,
        comment: 'Updated Test Review Comment'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Updated Test Review Comment');
  });

  test('should not update review without authentication', async () => {
    const res = await request(app)
      .put(`/api/review/reviews/${reviewId}`)
      .send({ rating: 3, comment: 'Unauthorized Update' });
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent review', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ rating: 3, comment: 'Non-existent Review' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should delete a review', async () => {
    const res = await request(app)
      .delete(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Review deleted successfully');
  });

  test('should not delete review without authentication', async () => {
    const res = await request(app).delete(`/api/review/reviews/${reviewId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted review', async () => {
    const res = await request(app)
      .get(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should return 404 when deleting non-existent review', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });
}); 