process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/usersmodel');
const Category = require('../models/categorymodel');
const Course = require('../models/coursemodel');
const Quiz = require('../models/quizmodel');
const { app, server, io } = require('../index');

const testUser = {
  name: 'Quiz Tester',
  email: 'quiztester@example.com',
  password: 'quiztest123',
  role: 'tutor',
};

let authToken;
let userId;
let categoryId;
let courseId;
let quizId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  // Clean up any existing test data
  await User.deleteOne({ email: testUser.email });
  await Category.deleteMany({ name: { $in: ['Test Category for Quiz'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Quiz'] } });
  await Quiz.deleteMany({ title: { $in: ['Test Quiz', 'Updated Test Quiz'] } });
  
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
    .field('name', 'Test Category for Quiz')
    .field('description', 'Test category for quiz testing')
    .attach('icon', path.join(__dirname, 'test-assets/test.png'));
  categoryId = categoryRes.body._id;
  
  // Create a test course
  const courseRes = await request(app)
    .post('/api/courses/')
    .set('Authorization', `Bearer ${authToken}`)
    .field('title', 'Test Course for Quiz')
    .field('description', 'Test course for quiz testing')
    .field('category_id', categoryId)
    .field('price', '99.99')
    .field('duration', '10 hours')
    .field('level', 'beginner')
    .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
  courseId = courseRes.body._id;
});

afterAll(async () => {
  // Clean up test data
  await Quiz.deleteMany({ title: { $in: ['Test Quiz', 'Updated Test Quiz'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Quiz'] } });
  await Category.deleteMany({ name: { $in: ['Test Category for Quiz'] } });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Quiz API', () => {
  test('should create a new quiz', async () => {
    const res = await request(app)
      .post('/api/quiz/quizzes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        course_id: courseId,
        title: 'Test Quiz',
        description: 'Test quiz description',
        total_marks: 100,
        passing_marks: 60
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Quiz');
    expect(res.body.description).toBe('Test quiz description');
    expect(res.body.total_marks).toBe(100);
    expect(res.body.passing_marks).toBe(60);
    quizId = res.body._id;
  });

  test('should not create quiz without authentication', async () => {
    const res = await request(app)
      .post('/api/quiz/quizzes')
      .send({
        course_id: courseId,
        title: 'Test Quiz No Auth',
        description: 'Test quiz without auth',
        total_marks: 100,
        passing_marks: 60
      });
    
    expect(res.statusCode).toBe(401);
  });

  test('should get all quizzes', async () => {
    const res = await request(app)
      .get('/api/quiz/quizzes')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all quizzes without authentication', async () => {
    const res = await request(app).get('/api/quiz/quizzes');
    
    expect(res.statusCode).toBe(401);
  });

  test('should get a quiz by id', async () => {
    const res = await request(app)
      .get(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', quizId);
    expect(res.body.title).toBe('Test Quiz');
  });

  test('should not get quiz by id without authentication', async () => {
    const res = await request(app).get(`/api/quiz/quizzes/${quizId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent quiz', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should update a quiz', async () => {
    const res = await request(app)
      .put(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        title: 'Updated Test Quiz',
        description: 'Updated quiz description',
        total_marks: 150,
        passing_marks: 75
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Test Quiz');
    expect(res.body.description).toBe('Updated quiz description');
    expect(res.body.total_marks).toBe(150);
    expect(res.body.passing_marks).toBe(75);
  });

  test('should not update quiz without authentication', async () => {
    const res = await request(app)
      .put(`/api/quiz/quizzes/${quizId}`)
      .send({ title: 'Unauthorized Update' });
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent quiz', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Non-existent Quiz' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should delete a quiz', async () => {
    const res = await request(app)
      .delete(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz deleted successfully');
  });

  test('should not delete quiz without authentication', async () => {
    const res = await request(app).delete(`/api/quiz/quizzes/${quizId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted quiz', async () => {
    const res = await request(app)
      .get(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should return 404 when deleting non-existent quiz', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });
}); 