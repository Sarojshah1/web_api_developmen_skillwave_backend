

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const Lesson = require('../../models/lessonmodel');
const { app, server, io } = require('../../index');

describe('Lesson API', () => {
  const makeUserAndLogin = async (email) => {
    await User.deleteOne({ email });
    await request(app)
      .post('/api/user/register')
      .field('name', 'Lesson Tester')
      .field('email', email)
      .field('password', 'lessontest123')
      .field('role', 'tutor')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'lessontest123' });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  };

  const makeCategory = async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Lesson')
      .field('description', 'Test category for lesson testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeCourse = async (token, categoryId) => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Course for Lesson')
      .field('description', 'Test course for lesson testing')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeLesson = async (token, courseId) => {
    const res = await request(app)
      .post('/api/lesson/lessons')
      .set('Authorization', `Bearer ${token}`)
      .field('course_id', courseId)
      .field('title', 'Test Lesson')
      .field('video_url', 'https://example.com/video.mp4')
      .field('order', '1')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: /lessontester/i });
      await Category.deleteMany({ name: { $regex: /^Test Category for Lesson/, $options: 'i' } });
      await Course.deleteMany({ title: { $regex: /^Test Course for Lesson/, $options: 'i' } });
      await Lesson.deleteMany({ title: { $regex: /^Test Lesson/, $options: 'i' } });
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    if (io) io.close();
    if (server) server.close();
  });

  test('should create a new lesson', async () => {
    const email = 'lessontester1@example.com';
    const { token, userId } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .post('/api/lesson/lessons')
      .set('Authorization', `Bearer ${token}`)
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
  });

  test('should not create lesson without authentication', async () => {
    const email = 'lessontester2@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
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
    const email = 'lessontester3@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    await makeLesson(token, courseId);
    const res = await request(app)
      .get('/api/lesson/lessons')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all lessons without authentication', async () => {
    const res = await request(app).get('/api/lesson/lessons');
    expect(res.statusCode).toBe(401);
  });

  test('should get a lesson by id', async () => {
    const email = 'lessontester4@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app)
      .get(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', lessonId);
    expect(res.body.title).toBe('Test Lesson');
  });

  test('should not get lesson by id without authentication', async () => {
    const email = 'lessontester5@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app).get(`/api/lesson/lessons/${lessonId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent lesson', async () => {
    const email = 'lessontester6@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should update a lesson', async () => {
    const email = 'lessontester7@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app)
      .put(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`)
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
    const email = 'lessontester8@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app)
      .put(`/api/lesson/lessons/${lessonId}`)
      .send({ title: 'Unauthorized Update' });
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent lesson', async () => {
    const email = 'lessontester9@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent Lesson' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should delete a lesson', async () => {
    const email = 'lessontester10@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app)
      .delete(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Lesson deleted successfully');
  });

  test('should not delete lesson without authentication', async () => {
    const email = 'lessontester11@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    const res = await request(app).delete(`/api/lesson/lessons/${lessonId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted lesson', async () => {
    const email = 'lessontester12@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const lessonId = await makeLesson(token, courseId);
    // Delete the lesson
    await request(app)
      .delete(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);
    // Now try to get the deleted lesson
    const res = await request(app)
      .get(`/api/lesson/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });

  test('should return 404 when deleting non-existent lesson', async () => {
    const email = 'lessontester13@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/lesson/lessons/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Lesson not found');
  });
}); 