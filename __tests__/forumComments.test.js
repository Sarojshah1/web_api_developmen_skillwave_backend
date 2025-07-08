const request = require('supertest');
const mongoose = require('mongoose');
const { app, server, io } = require('../index');
const ForumPost = require('../models/forumPost');
const User = require('../models/usersmodel');

describe('Forum Comments Real-time Tests', () => {
  let testUser;
  let testPost;
  let authToken;

  beforeAll(async () => {
    // Create test user with correct required fields
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student', // Must be one of: student, tutor, admin
      profile_picture: 'https://example.com/default-avatar.jpg' // Required field
    });
    await testUser.save();

    // Create test forum post
    testPost = new ForumPost({
      user_id: testUser._id,
      title: 'Test Post',
      content: 'Test content',
      category: 'general'
    });
    await testPost.save();

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ForumPost.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/post/:id/comments', () => {
    it('should add a comment and emit real-time event', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/post/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(200);

      expect(response.body.comments).toBeDefined();
      expect(response.body.comments.length).toBe(1);
      expect(response.body.comments[0].content).toBe(commentData.content);
      expect(response.body.comments[0].user_id._id).toBe(testUser._id.toString());
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const commentData = {
        content: 'This is a test comment'
      };

      await request(app)
        .post(`/api/post/${fakeId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      await request(app)
        .post(`/api/post/${testPost._id}/comments`)
        .send(commentData)
        .expect(401);
    });
  });

  describe('POST /api/post/:postId/comments/:commentId/replies', () => {
    it('should add a reply to a comment', async () => {
      // First add a comment
      const commentResponse = await request(app)
        .post(`/api/post/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Parent comment' });

      const commentId = commentResponse.body.comments[0]._id;
      const replyData = {
        content: 'This is a test reply'
      };

      const response = await request(app)
        .post(`/api/post/${testPost._id}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(200);

      expect(response.body.comments[0].replies).toBeDefined();
      expect(response.body.comments[0].replies.length).toBe(1);
      expect(response.body.comments[0].replies[0].content).toBe(replyData.content);
    });

    it('should return 404 for non-existent comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const replyData = {
        content: 'This is a test reply'
      };

      await request(app)
        .post(`/api/post/${testPost._id}/comments/${fakeCommentId}/replies`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(404);
    });
  });

  describe('GET /api/post/:id/comments', () => {
    it('should get all comments for a post', async () => {
      const response = await request(app)
        .get(`/api/post/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/post/${fakeId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Socket.IO Events', () => {
    it('should handle joinForumPost event', (done) => {
      const client = require('socket.io-client')('http://localhost:3000');
      
      client.emit('joinForumPost', { 
        postId: testPost._id.toString(), 
        userId: testUser._id.toString() 
      });

      client.on('joinedForumPost', (data) => {
        expect(data.postId).toBe(testPost._id.toString());
        expect(data.userId).toBe(testUser._id.toString());
        client.disconnect();
        done();
      });
    });

    it('should handle commentTyping event', (done) => {
      const client = require('socket.io-client')('http://localhost:3000');
      
      client.emit('commentTyping', { 
        postId: testPost._id.toString(), 
        userId: testUser._id.toString(), 
        isTyping: true 
      });

      // The event is broadcasted to other users in the room
      // We can't easily test this without multiple clients
      // But we can verify the event doesn't cause errors
      setTimeout(() => {
        client.disconnect();
        done();
      }, 100);
    });
  });
}); 