const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const Quiz = require('../../models/quizmodel');
const { app, server, io } = require('../../index');

describe('Quiz API', () => {
  const makeUserAndLogin = async (email) => {
    await User.deleteOne({ email });
    await request(app)
      .post('/api/user/register')
      .field('name', 'Quiz Tester')
      .field('email', email)
      .field('password', 'quiztest123')
      .field('role', 'tutor')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'quiztest123' });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  };

  const makeCategory = async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Quiz')
      .field('description', 'Test category for quiz testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeCourse = async (token, categoryId) => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Course for Quiz')
      .field('description', 'Test course for quiz testing')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeQuiz = async (token, courseId) => {
    const res = await request(app)
      .post('/api/quiz/quizzes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        course_id: courseId,
        title: 'Test Quiz',
        description: 'Test quiz description',
        total_marks: 100,
        passing_marks: 60
      });
    return res.body._id;
  };

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: /quiztester/i });
      await Category.deleteMany({ name: { $regex: /^Test Category for Quiz/, $options: 'i' } });
      await Course.deleteMany({ title: { $regex: /^Test Course for Quiz/, $options: 'i' } });
      await Quiz.deleteMany({ title: { $regex: /^Test Quiz/, $options: 'i' } });
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    if (io) io.close();
    if (server) server.close();
  });

  test('should create a new quiz', async () => {
    const email = 'quiztester1@example.com';
    const { token, userId } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .post('/api/quiz/quizzes')
      .set('Authorization', `Bearer ${token}`)
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
  });

  test('should not create quiz without authentication', async () => {
    const email = 'quiztester2@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
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
    const email = 'quiztester3@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    await makeQuiz(token, courseId);
    const res = await request(app)
      .get('/api/quiz/quizzes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all quizzes without authentication', async () => {
    const res = await request(app).get('/api/quiz/quizzes');
    expect(res.statusCode).toBe(401);
  });

  test('should get a quiz by id', async () => {
    const email = 'quiztester4@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app)
      .get(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', quizId);
    expect(res.body.title).toBe('Test Quiz');
  });

  test('should not get quiz by id without authentication', async () => {
    const email = 'quiztester5@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app).get(`/api/quiz/quizzes/${quizId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent quiz', async () => {
    const email = 'quiztester6@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should update a quiz', async () => {
    const email = 'quiztester7@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app)
      .put(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
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
    const email = 'quiztester8@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app)
      .put(`/api/quiz/quizzes/${quizId}`)
      .send({ title: 'Unauthorized Update' });
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent quiz', async () => {
    const email = 'quiztester9@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent Quiz' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should delete a quiz', async () => {
    const email = 'quiztester10@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app)
      .delete(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz deleted successfully');
  });

  test('should not delete quiz without authentication', async () => {
    const email = 'quiztester11@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    const res = await request(app).delete(`/api/quiz/quizzes/${quizId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted quiz', async () => {
    const email = 'quiztester12@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const quizId = await makeQuiz(token, courseId);
    // Delete the quiz
    await request(app)
      .delete(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`);
    // Now try to get the deleted quiz
    const res = await request(app)
      .get(`/api/quiz/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });

  test('should return 404 when deleting non-existent quiz', async () => {
    const email = 'quiztester13@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/quiz/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Quiz not found');
  });
}); 