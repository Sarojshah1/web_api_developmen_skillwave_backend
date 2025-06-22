process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const Lesson = require('../../models/lessonmodel');
const { app, server, io } = require('../../index');

const testUser = {
  name: 'Lesson Tester',
  email: 'lessontester@example.com',
  password: 'lessontest123',
  role: 'tutor',
};

let authToken;
let userId;
let categoryId;
let courseId;
let lessonId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  // Clean up any existing test data
  await User.deleteOne({ email: testUser.email });
  await Category.deleteMany({ name: { $in: ['Test Category for Lesson'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Lesson'] } });
  await Lesson.deleteMany({ title: { $in: ['Test Lesson', 'Updated Test Lesson'] } });
  
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
    .field('name', 'Test Category for Lesson')
    .field('description', 'Test category for lesson testing')
    .attach('icon', path.join(__dirname, 'test-assets/test.png'));
  categoryId = categoryRes.body._id;
  
  // Create a test course
  const courseRes = await request(app)
    .post('/api/courses/')
    .set('Authorization', `Bearer ${authToken}`)
    .field('title', 'Test Course for Lesson')
    .field('description', 'Test course for lesson testing')
    .field('category_id', categoryId)
    .field('price', '99.99')
    .field('duration', '10 hours')
    .field('level', 'beginner')
    .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
  courseId = courseRes.body._id;
});

afterAll(async () => {
  // Clean up test data
  await Lesson.deleteMany({ title: { $in: ['Test Lesson', 'Updated Test Lesson'] } });
  await Course.deleteMany({ title: { $in: ['Test Course for Lesson'] } });
  await Category.deleteMany({ name: { $in: ['Test Category for Lesson'] } });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Lesson API', () => {
  test('should create a new lesson', async () => {
    const res = await request(app)
      .post('/api/lesson/lessons')
      .set('Authorization', `Bearer ${authToken}`)
      .field('course_id', courseId)
      .field('title', 'Test Lesson')
      .field('video_url', 'https://example.com/video.mp4')
      .field('order', '1')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Lesson');
    expect(res.body.video_url).toBe('https://example.com/video.mp4');
    expect(res.body.order).toBe(1);
    expect(res.body).toHaveProperty('content');
    lessonId = res.body._id;
  });

  test('should not create lesson without authentication', async () => {
    const res = await request(app)
      .post('/api/lesson/lessons')
      .field('course_id', courseId)
      .field('title', 'Test Lesson No Auth')
      .field('video_url', 'https://example.com/video.mp4')
      .field('order', '1')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(401);
  });

  test('should get all lessons', async () => {
    const res = await request(app)
      .get('/api/lesson/lessons')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all lessons without authentication', async () => {
    const res = await request(app).get('/api/lesson/lessons');
    
    expect(res.statusCode).toBe(401);
  });

  test('should get a lesson by id', async () => {
    const res = await request(app)
      .get(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', lessonId);
    expect(res.body.title).toBe('Test Lesson');
  });

  test('should not get lesson by id without authentication', async () => {
    const res = await request(app).get(`/api/lesson/lessons/${lessonId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent lesson', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should update a lesson', async () => {
    const res = await request(app)
      .put(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        title: 'Updated Test Lesson',
        video_url: 'https://example.com/updated-video.mp4',
        order: 2
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Test Lesson');
    expect(res.body.video_url).toBe('https://example.com/updated-video.mp4');
    expect(res.body.order).toBe(2);
  });

  test('should not update lesson without authentication', async () => {
    const res = await request(app)
      .put(`/api/lesson/lessons/${lessonId}`)
      .send({ title: 'Unauthorized Update' });
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent lesson', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Non-existent Lesson' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should delete a lesson', async () => {
    const res = await request(app)
      .delete(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Lesson deleted successfully');
  });

  test('should not delete lesson without authentication', async () => {
    const res = await request(app).delete(`/api/lesson/lessons/${lessonId}`);
    
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted lesson', async () => {
    const res = await request(app)
      .get(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should return 404 when deleting non-existent lesson', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });
}); 