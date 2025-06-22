process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Blog = require('../../models/blogmodel');
const { app, server, io } = require('../../index');

const testUser = {
  name: 'Blog Tester',
  email: 'blogtester@example.com',
  password: 'blogtest123',
  role: 'student',
};

let authToken;
let userId;
let blogId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  await User.deleteOne({ email: testUser.email });
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
});

afterAll(async () => {
  await Blog.deleteMany({ user_id: userId });
  await User.deleteOne({ email: testUser.email });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Blog API', () => {
  test('should create a new blog', async () => {
    const res = await request(app)
      .post('/api/blog/blogs')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test Blog Title')
      .field('tags', 'test,blog')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Blog Title');
    blogId = res.body._id;
  });

  test('should get all blogs', async () => {
    const res = await request(app).get('/api/blog/blogs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get a blog by id', async () => {
    const res = await request(app)
      .get(`/api/blog/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', blogId);
  });

  test('should update a blog', async () => {
    const res = await request(app)
      .put(`/api/blog/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Blog Title', tags: ['updated', 'blog'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Blog Title');
  });

  test('should delete a blog', async () => {
    const res = await request(app)
      .delete(`/api/blog/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Blog deleted successfully');
  });

  test('should return 404 for deleted blog', async () => {
    const res = await request(app)
      .get(`/api/blog/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(404);
  });
}); 