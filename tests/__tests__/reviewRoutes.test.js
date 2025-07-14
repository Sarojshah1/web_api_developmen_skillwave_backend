const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Category = require('../../models/categorymodel');
const Course = require('../../models/coursemodel');
const Review = require('../../models/review');
const { app, server, io } = require('../../index');

describe('Review API', () => {
  const makeUserAndLogin = async (email) => {
    await User.deleteOne({ email });
    await request(app)
      .post('/api/user/register')
      .field('name', 'Review Tester')
      .field('email', email)
      .field('password', 'reviewtest123')
      .field('role', 'student')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'reviewtest123' });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  };

  const makeCategory = async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Review')
      .field('description', 'Test category for review testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    return res.body._id;
  };

  const makeCourse = async (token, categoryId) => {
    const res = await request(app)
      .post('/api/courses/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Course for Review')
      .field('description', 'Test course for review testing')
      .field('category_id', categoryId)
      .field('price', '99.99')
      .field('duration', '10 hours')
      .field('level', 'beginner')
      .attach('thumbnail', path.join(__dirname, 'test-assets/test.png'));
    if (res.statusCode !== 201) {
      throw new Error(`Failed to create course: ${res.statusCode} - ${JSON.stringify(res.body)}`);
    }
    return res.body._id;
  };

  const makeReview = async (token, courseId) => {
    const res = await request(app)
      .post('/api/review/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        course_id: courseId,
        rating: 5,
        comment: 'Test Review Comment'
      });
    if (res.statusCode !== 201) {
      throw new Error(`Failed to create review: ${res.statusCode} - ${JSON.stringify(res.body)}`);
    }
    return res.body._id;
  };

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: /reviewtester/i });
      await Category.deleteMany({ name: { $regex: /^Test Category for Review/, $options: 'i' } });
      await Course.deleteMany({ title: { $regex: /^Test Course for Review/, $options: 'i' } });
      await Review.deleteMany({ comment: { $regex: /^Test Review/, $options: 'i' } });
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    if (io) io.close();
    if (server) server.close();
  });

  test('should create a new review', async () => {
    const email = 'reviewtester1@example.com';
    const { token, userId } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const res = await request(app)
      .post('/api/review/reviews')
      .set('Authorization', `Bearer ${token}`)
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
  });

  test('should not create review without authentication', async () => {
    const email = 'reviewtester2@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
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
    const email = 'reviewtester3@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    await makeReview(token, courseId);
    const res = await request(app)
      .get('/api/review/reviews')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should not get all reviews without authentication', async () => {
    const res = await request(app).get('/api/review/reviews');
    expect(res.statusCode).toBe(401);
  });

  test('should get a review by id', async () => {
    const email = 'reviewtester4@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app)
      .get(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', reviewId);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Test Review Comment');
  });

  test('should not get review by id without authentication', async () => {
    const email = 'reviewtester5@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app).get(`/api/review/reviews/${reviewId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for non-existent review', async () => {
    const email = 'reviewtester6@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should get reviews by course id', async () => {
    const email = 'reviewtester7@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    await makeReview(token, courseId);
    const res = await request(app)
      .get(`/api/review/reviews/course/${courseId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should return empty array for course with no reviews', async () => {
    const fakeCourseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/review/reviews/course/${fakeCourseId}`);
    expect(res.statusCode).toBe(200);
    // The API might return an empty array or an object with empty array
    expect(res.body).toBeDefined();
    if (Array.isArray(res.body)) {
      expect(res.body.length).toBe(0);
    } else if (res.body.reviews) {
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(res.body.reviews.length).toBe(0);
    }
  });

  test('should update a review', async () => {
    const email = 'reviewtester8@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app)
      .put(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        rating: 4,
        comment: 'Updated Test Review Comment'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Updated Test Review Comment');
  });

  test('should not update review without authentication', async () => {
    const email = 'reviewtester9@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app)
      .put(`/api/review/reviews/${reviewId}`)
      .send({ rating: 3, comment: 'Unauthorized Update' });
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 when updating non-existent review', async () => {
    const email = 'reviewtester10@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, comment: 'Non-existent Review' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should delete a review', async () => {
    const email = 'reviewtester11@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app)
      .delete(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Review deleted successfully');
  });

  test('should not delete review without authentication', async () => {
    const email = 'reviewtester12@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    const res = await request(app).delete(`/api/review/reviews/${reviewId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should return 404 for deleted review', async () => {
    const email = 'reviewtester13@example.com';
    const { token } = await makeUserAndLogin(email);
    const categoryId = await makeCategory();
    const courseId = await makeCourse(token, categoryId);
    const reviewId = await makeReview(token, courseId);
    // Delete the review
    await request(app)
      .delete(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);
    // Now try to get the deleted review
    const res = await request(app)
      .get(`/api/review/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });

  test('should return 404 when deleting non-existent review', async () => {
    const email = 'reviewtester14@example.com';
    const { token } = await makeUserAndLogin(email);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/review/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Review not found');
  });
}); 