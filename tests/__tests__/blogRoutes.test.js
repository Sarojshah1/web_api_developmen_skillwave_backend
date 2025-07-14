

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/usersmodel');
const Blog = require('../../models/blogmodel');
const { app, server, io } = require('../../index');

afterAll(async () => {
  if (io) io.close();
  if (server) server.close();
});

describe('Blog API', () => {
  function uniqueEmail() {
    return `blogtest_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
  }

  async function createUserAndLogin() {
    const email = uniqueEmail();
    const password = 'blogtest123';
    await request(app)
      .post('/api/user/register')
      .field('name', 'Blog Tester')
      .field('email', email)
      .field('password', password)
      .field('role', 'student')
      .attach('profile_picture', path.join(__dirname, 'test-assets/test.png'));
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    return { token: loginRes.body.token, userId: loginRes.body.id };
  }

  async function createBlog(token, title = 'Test Blog Title') {
    const res = await request(app)
      .post('/api/blog/blogs')
      .set('Authorization', `Bearer ${token}`)
      .field('title', title)
      .field('tags', 'test,blog')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    return res.body;
  }

  test('should create a new blog', async () => {
    const { token } = await createUserAndLogin();
    const res = await request(app)
      .post('/api/blog/blogs')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Blog Title')
      .field('tags', 'test,blog')
      .attach('content', path.join(__dirname, 'test-assets/test.png'));
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Blog Title');
  });

  test('should get all blogs', async () => {
    const { token } = await createUserAndLogin();
    await createBlog(token, 'Test Blog for Get All');
    const res = await request(app).get('/api/blog/blogs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get a blog by id', async () => {
    const { token } = await createUserAndLogin();
    const blog = await createBlog(token, 'Test Blog for Get By ID');
    const res = await request(app)
      .get(`/api/blog/blogs/${blog._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', blog._id);
  });

  test('should update a blog', async () => {
    const { token } = await createUserAndLogin();
    const blog = await createBlog(token, 'Test Blog for Update');
    const res = await request(app)
      .put(`/api/blog/blogs/${blog._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Blog Title', tags: ['updated', 'blog'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Blog Title');
  });

  test('should delete a blog', async () => {
    const { token } = await createUserAndLogin();
    const blog = await createBlog(token, 'Test Blog for Delete');
    const res = await request(app)
      .delete(`/api/blog/blogs/${blog._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Blog deleted successfully');
  });

  test('should return 404 for deleted blog', async () => {
    const { token } = await createUserAndLogin();
    const blog = await createBlog(token, 'Test Blog for Delete Check');
    await request(app)
      .delete(`/api/blog/blogs/${blog._id}`)
      .set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .get(`/api/blog/blogs/${blog._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
}); 