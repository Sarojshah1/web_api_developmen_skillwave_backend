const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const Enrollment = require('../../models/enrollmentmodel');
const { app, server, io } = require('../../index');

describe('Enrollment API', () => {
  const makeUserAndLogin = async (email) => {
    await User.deleteOne({ email });
    await request(app)
      .post('/api/user/register')
      .field('name', 'Enrollment Tester')
      .field('email', email)
      .field('password', 'enrollmenttest123')
      .field('role', 'student')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'enrollmenttest123' });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  };

  const makeCategory = async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Enrollment')
      .field('description', 'Test category for enrollment testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeCourse = async (token, categoryId) => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Course for Enrollment')
      .field('description', 'Test course for enrollment testing')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeEnrollment = async (token, courseId) => {
    const res = await request(app)
      .post('/api/enroll/')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId });
    return res.body._id;
  };

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: /enrollmenttester/i });
      await Category.deleteMany({ name: { $regex: /^Test Category for Enrollment/, $options: 'i' } });
      await Course.deleteMany({ title: { $regex: /^Test Course for Enrollment/, $options: 'i' } });
      await Enrollment.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    if (io) io.close();
    if (server) server.close();
  });

  test('should create a new enrollment', async () => {
    const email = 'enrollmenttester1@example.com';
    const { token, userId } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .post('/api/enroll/')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.user_id).toBe(userId);
    expect(res.body.course_id).toBe(courseId);
    expect(res.body.status).toBe('in-progress');
    expect(res.body.progress).toBe(0);
  });

  test('should not create enrollment without authentication', async () => {
    const email = 'enrollmenttester2@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .post('/api/enroll/')
      .send({ course_id: courseId });
    expect(res.statusCode).toBe(401);
  });

  test('should get user enrollments', async () => {
    const email = 'enrollmenttester3@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    await makeEnrollment(token, courseId);
    const res = await request(app)
      .get('/api/enroll/user')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get user enrollments without authentication', async () => {
    const res = await request(app).get('/api/enroll/user');
    expect(res.statusCode).toBe(401);
  });

  test('should update enrollment progress', async () => {
    const email = 'enrollmenttester4@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 50 });
    expect(res.statusCode).toBe(200);
    expect(res.body.progress).toBe(50);
    expect(res.body.status).toBe('in-progress');
  });

  test('should complete enrollment when progress reaches 100', async () => {
    const email = 'enrollmenttester5@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 100 });
    expect(res.statusCode).toBe(200);
    expect(res.body.progress).toBe(100);
    expect(res.body.status).toBe('completed');
    expect(res.body).toHaveProperty('completed_at');
  });

  test('should not update enrollment without authentication', async () => {
    const email = 'enrollmenttester6@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    const res = await request(app)
      .put(`/api/enroll/${enrollmentId}`)
      .send({ progress: 75 });
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent enrollment', async () => {
    const email = 'enrollmenttester7@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/enroll/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 50 });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Enrollment not found');
  });

  test('should delete an enrollment', async () => {
    const email = 'enrollmenttester8@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    const res = await request(app)
      .delete(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Enrollment deleted successfully');
  });

  test('should not delete enrollment without authentication', async () => {
    const email = 'enrollmenttester9@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    const res = await request(app).delete(`/api/enroll/${enrollmentId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when deleting non-existent enrollment', async () => {
    const email = 'enrollmenttester10@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/enroll/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Enrollment not found');
  });

  test('should return empty array for user enrollments after deletion', async () => {
    const email = 'enrollmenttester11@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const enrollmentId = await makeEnrollment(token, courseId);
    // Delete the enrollment
    await request(app)
      .delete(`/api/enroll/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`);
    // Now check enrollments
    const res = await request(app)
      .get('/api/enroll/user')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
}); 