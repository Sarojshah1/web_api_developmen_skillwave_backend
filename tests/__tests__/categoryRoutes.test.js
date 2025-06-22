process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/e-learning-test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const Category = require('../../models/categorymodel');
const { app, server, io } = require('../../index');

let categoryId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  // Clean up any existing test categories
  await Category.deleteMany({ name: { $in: ['Test Category', 'Updated Test Category'] } });
});

afterAll(async () => {
  // Clean up test categories
  await Category.deleteMany({ name: { $in: ['Test Category', 'Updated Test Category'] } });
  await mongoose.connection.close();
  if (io) io.close();
  if (server) server.close();
});

describe('Category API', () => {
  test('should create a new category', async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category')
      .field('description', 'Test category description')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Test Category');
    expect(res.body.description).toBe('Test category description');
    expect(res.body).toHaveProperty('icon');
    categoryId = res.body._id;
  });

  test('should not create category without icon', async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category No Icon')
      .field('description', 'Test category without icon');
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Image not found');
  });

  test('should get all categories', async () => {
    const res = await request(app).get('/api/category/');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get a category by id', async () => {
    const res = await request(app).get(`/api/category/${categoryId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', categoryId);
    expect(res.body.name).toBe('Test Category');
  });

  test('should return 404 for non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/category/${fakeId}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test('should update a category', async () => {
    const res = await request(app)
      .put(`/api/category/${categoryId}`)
      .send({ 
        name: 'Updated Test Category',
        description: 'Updated description'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Test Category');
    expect(res.body.description).toBe('Updated description');
  });

  test('should return 404 when updating non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/category/${fakeId}`)
      .send({ name: 'Non-existent Category' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test('should delete a category', async () => {
    const res = await request(app).delete(`/api/category/${categoryId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Category deleted successfully');
  });

  test('should return 404 for deleted category', async () => {
    const res = await request(app).get(`/api/category/${categoryId}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test('should return 404 when deleting non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/category/${fakeId}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });
}); 