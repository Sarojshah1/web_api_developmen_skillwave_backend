

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const Category = require('../../models/categorymodel');
const { app, server, io } = require('../../index');

beforeAll(async () => {
  // Clean up any existing test categories
  await Category.deleteMany({ name: { $regex: /^Test Category/, $options: 'i' } });
});

afterAll(async () => {
  // Clean up test categories
  try {
    await Category.deleteMany({ name: { $regex: /^Test Category/, $options: 'i' } });
  } catch (error) {
    // Ignore cleanup errors if connection is already closed
  }
  if (io) io.close();
  if (server) server.close();
});

describe('Category API', () => {
  test('should create a new category', async () => {
    const res = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category Create')
      .field('description', 'Test category description')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Test Category Create');
    expect(res.body.description).toBe('Test category description');
    expect(res.body).toHaveProperty('icon');
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
    // First create a category to ensure there's data to retrieve
    await request(app)
      .post('/api/category/')
      .field('name', 'Test Category for Get All')
      .field('description', 'Test category for get all testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    const res = await request(app).get('/api/category/');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should get a category by id', async () => {
    // First create a category
    const createRes = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category Get By ID')
      .field('description', 'Test category for get by id testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    const categoryId = createRes.body._id;
    
    const res = await request(app).get(`/api/category/${categoryId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', categoryId);
    expect(res.body.name).toBe('Test Category Get By ID');
  });

  test('should return 404 for non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/category/${fakeId}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test('should update a category', async () => {
    // First create a category
    const createRes = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category Update')
      .field('description', 'Test category for update testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    const categoryId = createRes.body._id;
    
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
    // First create a category
    const createRes = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category Delete')
      .field('description', 'Test category for delete testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    const categoryId = createRes.body._id;
    
    const res = await request(app).delete(`/api/category/${categoryId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Category deleted successfully');
  });

  test('should return 404 for deleted category', async () => {
    // First create a category
    const createRes = await request(app)
      .post('/api/category/')
      .field('name', 'Test Category Delete Check')
      .field('description', 'Test category for delete check testing')
      .attach('icon', path.join(__dirname, 'test-assets/test.png'));
    
    const categoryId = createRes.body._id;
    
    // Delete the category
    await request(app).delete(`/api/category/${categoryId}`);
    
    // Try to get the deleted category
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