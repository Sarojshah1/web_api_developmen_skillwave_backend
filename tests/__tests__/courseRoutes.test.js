const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const { app, server, io } = require('../../index');

describe('Course API', () => {
  const makeUserAndLogin = async (email) => {
    await User.deleteOne({ email });
    await request(app)
      .post('/api/user/register')
      .field('name', 'Course Tester')
      .field('email', email)
      .field('password', 'coursetest123')
      .field('role', 'tutor')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'coursetest123' });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  };

  const makeCategory = async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Course')
      .field('description', 'Test category for course testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeCourse = async (token, categoryId) => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Course')
      .field('description', 'Test course description')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: /coursetester/i });
      await Category.deleteMany({ name: { $regex: /^Test Category for Course/, $options: 'i' } });
      await Course.deleteMany({ title: { $regex: /^Test Course/, $options: 'i' } });
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    if (io) io.close();
    if (server) server.close();
  });

  test('should create a new course', async () => {
    const email = 'coursetester1@example.com';
    const { token, userId } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
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
  });

  test('should not create course without authentication', async () => {
    const email = 'coursetester2@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
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
    const email = 'coursetester3@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    await makeCourse(token, categoryId);
    const res = await request(app).get('/api/courses/');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get courses with pagination', async () => {
    const email = 'coursetester4@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    await makeCourse(token, categoryId);
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
    const email = 'coursetester5@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', courseId);
    expect(res.body.title).toBe('Test Course');
  });

  test('should not get course by id without authentication', async () => {
    const email = 'coursetester6@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app).get(`/api/courses/${courseId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent course', async () => {
    const email = 'coursetester7@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should get courses by creator', async () => {
    const email = 'coursetester8@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    await makeCourse(token, categoryId);
    const res = await request(app)
      .get('/api/courses/creator')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get courses by creator without authentication', async () => {
    const res = await request(app).get('/api/courses/creator');
    expect(res.statusCode).toBe(401);
  });

  test('should get courses by category', async () => {
    const email = 'coursetester9@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    await makeCourse(token, categoryId);
    const res = await request(app)
      .get(`/api/courses/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should return 404 for non-existent category courses', async () => {
    const email = 'coursetester10@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeCategoryId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/courses/category/${fakeCategoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('No courses found for this category');
  });

  test('should update a course', async () => {
    const email = 'coursetester11@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
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
    const email = 'coursetester12@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .send({ title: 'Unauthorized Update' });
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent course', async () => {
    const email = 'coursetester13@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent Course' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should delete a course', async () => {
    const email = 'coursetester14@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Course deleted successfully');
  });

  test('should not delete course without authentication', async () => {
    const email = 'coursetester15@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app).delete(`/api/courses/${courseId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted course', async () => {
    const email = 'coursetester16@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    // Delete the course
    await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    // Try to get the deleted course
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  test('should return 404 when deleting non-existent course', async () => {
    const email = 'coursetester17@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });
}); 