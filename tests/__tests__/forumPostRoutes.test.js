

// const request = require('supertest');
// const mongoose = require('mongoose');
// const path = require('path');
// const { app, server, io } = require('../../index');
// const ForumPost = require('../../models/forumPost');
// const User = require('../../models/usersmodel');

// let authToken;
// let userId;
// let forumPostId;
// let testUser;
// let testPost1;
// let testPost2;
// let testPost3;

// describe('Forum Post Routes', () => {
//   beforeAll(async () => {
//     // Create test user
//     testUser = new User({
//       name: 'Test User',
//       email: 'testuser@example.com',
//       password: 'test123456',
//       role: 'student',
//       profile_picture: 'test-profile.jpg',
//       search_history: ['javascript', 'react', 'programming']
//     });
//     await testUser.save();

//     // Get auth token
//     const loginResponse = await request(app)
//       .post('/api/user/login')
//       .send({
//         email: 'testuser@example.com',
//         password: 'test123456',
//       });
//     authToken = loginResponse.body.token;

//     // Create test posts
//     testPost1 = new ForumPost({
//       user_id: testUser._id,
//       title: 'JavaScript Best Practices',
//       content: 'Here are some JavaScript best practices for beginners...',
//       tags: ['javascript', 'programming', 'best-practices'],
//       category: 'technical',
//       likes: [testUser._id],
//       views: 50,
//       engagement_score: 100
//     });
//     await testPost1.save();

//     testPost2 = new ForumPost({
//       user_id: testUser._id,
//       title: 'React Hooks Tutorial',
//       content: 'Learn how to use React hooks effectively...',
//       tags: ['react', 'javascript', 'hooks'],
//       category: 'technical',
//       likes: [],
//       views: 25,
//       engagement_score: 50
//     });
//     await testPost2.save();

//     testPost3 = new ForumPost({
//       user_id: testUser._id,
//       title: 'General Discussion',
//       content: 'This is a general discussion post...',
//       tags: ['general', 'discussion'],
//       category: 'general',
//       likes: [],
//       views: 10,
//       engagement_score: 20
//     });
//     await testPost3.save();
//   });

//   afterAll(async () => {
//     // Close server and socket.io
//     if (io) {
//       io.close();
//     }
//     if (server) {
//       server.close();
//     }
//   });

//   beforeEach(async () => {
//     await ForumPost.deleteMany({});
//   });

//   describe('POST /api/post', () => {
//     it('should create a new forum post', async () => {
//       const postData = {
//         title: 'Test Forum Post',
//         content: 'This is a test forum post content',
//         tags: ['javascript', 'testing']
//       };

//       const response = await request(app)
//         .post('/api/post')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send(postData);

//       expect(response.status).toBe(201);
//       expect(response.body.title).toBe(postData.title);
//       expect(response.body.content).toBe(postData.content);
//       expect(response.body.tags).toEqual(postData.tags);
//       expect(response.body.user_id).toBe(userId.toString());

//       forumPostId = response.body._id;
//     });

//     it('should create a forum post with images', async () => {
//       const postData = {
//         title: 'Test Forum Post with Images',
//         content: 'This is a test forum post with images',
//         tags: ['react', 'frontend']
//       };

//       const response = await request(app)
//         .post('/api/post')
//         .set('Authorization', `Bearer ${authToken}`)
//         .attach('images', '__tests__/test-assets/test.png')
//         .field('title', postData.title)
//         .field('content', postData.content)
//         .field('tags', JSON.stringify(postData.tags));

//       expect(response.status).toBe(201);
//       expect(response.body.images).toHaveLength(1);
//       expect(response.body.images[0]).toContain('/uploads/forum/');
//     });
//   });

//   describe('GET /api/post', () => {
//     beforeEach(async () => {
//       // Create multiple test posts
//       const posts = [
//         {
//           user_id: userId,
//           title: 'JavaScript Best Practices',
//           content: 'Here are some JavaScript best practices for beginners',
//           tags: ['javascript', 'best-practices'],
//           created_at: new Date()
//         },
//         {
//           user_id: userId,
//           title: 'React Hooks Tutorial',
//           content: 'Learn how to use React hooks effectively',
//           tags: ['react', 'hooks', 'frontend'],
//           created_at: new Date()
//         },
//         {
//           user_id: userId,
//           title: 'Node.js Backend Development',
//           content: 'Building scalable backend with Node.js',
//           tags: ['nodejs', 'backend', 'api'],
//           created_at: new Date()
//         }
//       ];

//       await ForumPost.insertMany(posts);
//     });

//     it('should get all forum posts with recommendations', async () => {
//       const response = await request(app)
//         .get('/api/post')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(3);
//       expect(response.body.pagination).toBeDefined();
//       expect(response.body.recommendations).toBeDefined();
//     });

//     it('should paginate forum posts correctly', async () => {
//       const response = await request(app)
//         .get('/api/post?page=1&limit=2')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.data).toHaveLength(2);
//       expect(response.body.pagination.currentPage).toBe(1);
//       expect(response.body.pagination.hasNextPage).toBe(true);
//     });
//   });

//   describe('GET /api/post/search', () => {
//     beforeEach(async () => {
//       // Create test posts for search
//       const posts = [
//         {
//           user_id: userId,
//           title: 'JavaScript Fundamentals',
//           content: 'Learn the basics of JavaScript programming',
//           tags: ['javascript', 'basics'],
//           created_at: new Date()
//         },
//         {
//           user_id: userId,
//           title: 'Advanced React Patterns',
//           content: 'Advanced patterns for React development',
//           tags: ['react', 'advanced'],
//           created_at: new Date()
//         }
//       ];

//       await ForumPost.insertMany(posts);
//     });

//     it('should search posts by query', async () => {
//       const response = await request(app)
//         .get('/api/post/search?query=javascript')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(1);
//       expect(response.body.data[0].title).toContain('JavaScript');
//       expect(response.body.searchInfo.query).toBe('javascript');
//     });

//     it('should search posts by tags', async () => {
//       const response = await request(app)
//         .get('/api/post/search?tags=react')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(1);
//       expect(response.body.data[0].tags).toContain('react');
//     });

//     it('should return 400 for empty search', async () => {
//       const response = await request(app)
//         .get('/api/post/search')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//     });

//     it('should update user search history', async () => {
//       await request(app)
//         .get('/api/post/search?query=javascript programming')
//         .set('Authorization', `Bearer ${authToken}`);

//       // Check if search history was updated
//       const user = await User.findById(userId);
//       expect(user.search_history).toContain('javascript');
//       expect(user.search_history).toContain('programming');
//     });
//   });

//   describe('GET /api/post/search/history', () => {
//     it('should get user search history', async () => {
//       const response = await request(app)
//         .get('/api/post/search/history')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.searchHistory).toContain('javascript');
//       expect(response.body.data.searchFrequency).toBeDefined();
//     });
//   });

//   describe('DELETE /api/post/search/history', () => {
//     it('should clear user search history', async () => {
//       const response = await request(app)
//         .delete('/api/post/search/history')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);

//       // Verify search history is cleared
//       const user = await User.findById(userId);
//       expect(user.search_history).toHaveLength(0);
//     });
//   });

//   describe('GET /api/post/:id', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Test Post for Get',
//         content: 'Test content for getting a specific post',
//         tags: ['test']
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should get a specific forum post', async () => {
//       const response = await request(app)
//         .get(`/api/post/${forumPostId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.title).toBe('Test Post for Get');
//       expect(response.body.user_id._id).toBe(userId.toString());
//     });

//     it('should return 404 for non-existent post', async () => {
//       const fakeId = new mongoose.Types.ObjectId();
//       const response = await request(app)
//         .get(`/api/post/${fakeId}`);

//       expect(response.status).toBe(404);
//     });
//   });

//   describe('PUT /api/post/:id', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Original Title',
//         content: 'Original content',
//         tags: ['original']
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should update a forum post', async () => {
//       const updateData = {
//         title: 'Updated Title',
//         content: 'Updated content',
//         tags: ['updated', 'test']
//       };

//       const response = await request(app)
//         .put(`/api/post/${forumPostId}`)
//         .set('Authorization', `Bearer ${authToken}`)
//         .send(updateData);

//       expect(response.status).toBe(200);
//       expect(response.body.title).toBe(updateData.title);
//       expect(response.body.content).toBe(updateData.content);
//       expect(response.body.tags).toEqual(updateData.tags);
//     });
//   });

//   describe('DELETE /api/post/:id', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Post to Delete',
//         content: 'This post will be deleted',
//         tags: ['delete']
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should delete a forum post', async () => {
//       const response = await request(app)
//         .delete(`/api/post/${forumPostId}`)
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Forum post deleted successfully');

//       // Verify post is deleted
//       const deletedPost = await ForumPost.findById(forumPostId);
//       expect(deletedPost).toBeNull();
//     });
//   });

//   describe('POST /api/post/:id/like', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Post to Like',
//         content: 'This post will be liked',
//         tags: ['like']
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should add a like to a forum post', async () => {
//       const response = await request(app)
//         .post(`/api/post/${forumPostId}/like`)
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body.likes).toContain(userId.toString());
//     });

//     it('should not allow duplicate likes', async () => {
//       // Add first like
//       await request(app)
//         .post(`/api/post/${forumPostId}/like`)
//         .set('Authorization', `Bearer ${authToken}`);

//       // Try to add second like
//       const response = await request(app)
//         .post(`/api/post/${forumPostId}/like`)
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe('User has already liked this post');
//     });
//   });

//   describe('POST /api/post/:id/comments', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Post for Comments',
//         content: 'This post will have comments',
//         tags: ['comments']
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should add a comment to a forum post', async () => {
//       const commentData = {
//         content: 'This is a test comment'
//       };

//       const response = await request(app)
//         .post(`/api/post/${forumPostId}/comments`)
//         .set('Authorization', `Bearer ${authToken}`)
//         .send(commentData);

//       expect(response.status).toBe(200);
//       expect(response.body.comments).toHaveLength(1);
//       expect(response.body.comments[0].content).toBe(commentData.content);
//       expect(response.body.comments[0].user_id._id).toBe(userId.toString());
//     });
//   });

//   describe('GET /api/post/:id/comments', () => {
//     beforeEach(async () => {
//       const post = new ForumPost({
//         user_id: userId,
//         title: 'Post for Getting Comments',
//         content: 'This post will have comments to retrieve',
//         tags: ['comments'],
//         comments: [
//           {
//             user_id: userId,
//             content: 'First comment',
//             created_at: new Date()
//           },
//           {
//             user_id: userId,
//             content: 'Second comment',
//             created_at: new Date()
//           }
//         ]
//       });
//       await post.save();
//       forumPostId = post._id;
//     });

//     it('should get comments for a forum post', async () => {
//       const response = await request(app)
//         .get(`/api/post/${forumPostId}/comments`)
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveLength(2);
//       expect(response.body[0].content).toBe('First comment');
//       expect(response.body[1].content).toBe('Second comment');
//     });
//   });
// });

// describe('Forum Post Recommendation System API', () => {
//   describe('GET /api/forumpost/ - Get all posts with recommendations', () => {
//     test('should return posts with recommendation metadata', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('totalPosts');
//       expect(res.body).toHaveProperty('currentPage');
//       expect(res.body).toHaveProperty('totalPages');
//       expect(res.body).toHaveProperty('recommendations');
//       expect(res.body.recommendations).toHaveProperty('contentBased');
//       expect(res.body.recommendations).toHaveProperty('popular');
//       expect(res.body.recommendations).toHaveProperty('trending');
//       expect(res.body.recommendations).toHaveProperty('recent');
//       expect(res.body.recommendations).toHaveProperty('collaborative');
//     });

//     test('should return paginated results', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/?page=1&limit=2')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeLessThanOrEqual(2);
//       expect(res.body.currentPage).toBe(1);
//     });
//   });

//   describe('GET /api/forumpost/recommendations/personalized - Get personalized recommendations', () => {
//     test('should return personalized recommendations', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/personalized')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('recommendations');
//       expect(res.body).toHaveProperty('userTags');
//       expect(res.body).toHaveProperty('summary');
//       expect(res.body.recommendations).toHaveProperty('contentBased');
//       expect(res.body.recommendations).toHaveProperty('popular');
//       expect(res.body.recommendations).toHaveProperty('trending');
//       expect(res.body.recommendations).toHaveProperty('recent');
//       expect(res.body.recommendations).toHaveProperty('collaborative');
//     });

//     test('should include user search history in recommendations', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/personalized')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.userTags).toContain('javascript');
//       expect(res.body.userTags).toContain('react');
//       expect(res.body.userTags).toContain('programming');
//     });
//   });

//   describe('GET /api/forumpost/recommendations/:type - Get recommendations by type', () => {
//     test('should return content-based recommendations', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/contentBased')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('type', 'contentBased');
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('count');
//     });

//     test('should return popular posts', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/popular')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('type', 'popular');
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('count');
//     });

//     test('should return trending posts', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/trending')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('type', 'trending');
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('count');
//     });

//     test('should return recent posts', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/recent')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('type', 'recent');
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('count');
//     });

//     test('should return collaborative recommendations', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/collaborative')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('type', 'collaborative');
//       expect(res.body).toHaveProperty('posts');
//       expect(res.body).toHaveProperty('count');
//     });

//     test('should return error for invalid recommendation type', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/invalid')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(400);
//       expect(res.body).toHaveProperty('message', 'Invalid recommendation type');
//     });

//     test('should respect limit parameter', async () => {
//       const res = await request(app)
//         .get('/api/forumpost/recommendations/popular?limit=1')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeLessThanOrEqual(1);
//     });
//   });

//   describe('POST /api/forumpost/:id/view - Increment view count', () => {
//     test('should increment view count', async () => {
//       const initialViews = testPost1.views;
      
//       const res = await request(app)
//         .post(`/api/forumpost/${testPost1._id}/view`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty('message', 'View count updated');
//       expect(res.body.views).toBe(initialViews + 1);
//     });

//     test('should return 404 for non-existent post', async () => {
//       const fakeId = new mongoose.Types.ObjectId();
//       const res = await request(app)
//         .post(`/api/forumpost/${fakeId}/view`);

//       expect(res.statusCode).toBe(404);
//       expect(res.body).toHaveProperty('message', 'Forum post not found');
//     });
//   });

//   describe('POST /api/forumpost/ - Create forum post with category', () => {
//     test('should create forum post with category', async () => {
//       const res = await request(app)
//         .post('/api/forumpost/')
//         .set('Authorization', `Bearer ${authToken}`)
//         .field('title', 'Test Post with Category')
//         .field('content', 'This is a test post with category')
//         .field('tags', 'test,category')
//         .field('category', 'academic')
//         .attach('images', path.join(__dirname, 'test-assets/test.png'));

//       expect(res.statusCode).toBe(201);
//       expect(res.body).toHaveProperty('title', 'Test Post with Category');
//       expect(res.body).toHaveProperty('category', 'academic');
//       expect(res.body).toHaveProperty('engagement_score');
//       expect(res.body).toHaveProperty('views', 0);
//     });

//     test('should create forum post without category (defaults to general)', async () => {
//       const res = await request(app)
//         .post('/api/forumpost/')
//         .set('Authorization', `Bearer ${authToken}`)
//         .field('title', 'Test Post without Category')
//         .field('content', 'This is a test post without category')
//         .field('tags', 'test,general');

//       expect(res.statusCode).toBe(201);
//       expect(res.body).toHaveProperty('title', 'Test Post without Category');
//       expect(res.body).toHaveProperty('category', 'general');
//     });
//   });

//   describe('Engagement score calculation', () => {
//     test('should calculate engagement score correctly', async () => {
//       const post = new ForumPost({
//         user_id: testUser._id,
//         title: 'Engagement Test Post',
//         content: 'Testing engagement score calculation',
//         tags: ['test', 'engagement'],
//         category: 'general',
//         likes: [testUser._id, new mongoose.Types.ObjectId()], // 2 likes
//         views: 10,
//         comments: [
//           {
//             user_id: testUser._id,
//             content: 'Test comment',
//             created_at: new Date()
//           }
//         ] // 1 comment
//       });

//       await post.save();

//       // Engagement score = (likes * 2) + (comments * 3) + views
//       // = (2 * 2) + (1 * 3) + 10 = 4 + 3 + 10 = 17
//       expect(post.engagement_score).toBe(17);
//     });
//   });

//   describe('Recommendation algorithm tests', () => {
//     test('should prioritize content-based recommendations for users with search history', async () => {
//       // Create a post that matches user's search history
//       const matchingPost = new ForumPost({
//         user_id: testUser._id,
//         title: 'Advanced JavaScript Programming',
//         content: 'Advanced JavaScript programming techniques...',
//         tags: ['javascript', 'programming', 'advanced'],
//         category: 'technical',
//         engagement_score: 80
//       });
//       await matchingPost.save();

//       const res = await request(app)
//         .get('/api/forumpost/recommendations/contentBased')
//         .set('Authorization', `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeGreaterThan(0);
      
//       // Check if the matching post is in the recommendations
//       const matchingPostFound = res.body.posts.some(post => 
//         post.title === 'Advanced JavaScript Programming'
//       );
//       expect(matchingPostFound).toBe(true);

//       await ForumPost.findByIdAndDelete(matchingPost._id);
//     });
//   });
// });

// describe('Forum Post Routes with Recommendation System', () => {
//   let authToken;
//   let testUser;
//   let testPost1;
//   let testPost2;
//   let testPost3;

//   beforeAll(async () => {
//     // Connect to test database
//     if (mongoose.connection.readyState === 0) {
//       await mongoose.connect(process.env.MONGO_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
//     }

//     // Create test user
//     testUser = new User({
//       name: "Test User",
//       email: "testuser@example.com",
//       password: "test123456",
//       role: "student",
//       profile_picture: "test-profile.jpg",
//       search_history: ["javascript", "react", "programming"]
//     });
//     await testUser.save();

//     // Get auth token
//     const loginResponse = await request(app)
//       .post("/api/user/login")
//       .send({
//         email: "testuser@example.com",
//         password: "test123456",
//       });
//     authToken = loginResponse.body.token;

//     // Create test posts
//     testPost1 = new ForumPost({
//       user_id: testUser._id,
//       title: "JavaScript Best Practices",
//       content: "Here are some JavaScript best practices for beginners...",
//       tags: ["javascript", "programming", "best-practices"],
//       category: "technical",
//       likes: [testUser._id],
//       views: 50,
//       engagement_score: 100
//     });
//     await testPost1.save();

//     testPost2 = new ForumPost({
//       user_id: testUser._id,
//       title: "React Hooks Tutorial",
//       content: "Learn how to use React hooks effectively...",
//       tags: ["react", "javascript", "hooks"],
//       category: "technical",
//       likes: [],
//       views: 25,
//       engagement_score: 50
//     });
//     await testPost2.save();

//     testPost3 = new ForumPost({
//       user_id: testUser._id,
//       title: "General Discussion",
//       content: "This is a general discussion post...",
//       tags: ["general", "discussion"],
//       category: "general",
//       likes: [],
//       views: 10,
//       engagement_score: 20
//     });
//     await testPost3.save();
//   });

//   afterAll(async () => {
//     // Clean up test data
//     await ForumPost.deleteMany({});
//     await User.deleteOne({ email: "testuser@example.com" });
    
//     // Close database connection
//     await mongoose.connection.close();
    
//     // Close server and socket.io
//     if (io) {
//       io.close();
//     }
//     if (server) {
//       server.close();
//     }
//   });

//   describe("GET /api/forumpost/ - Enhanced getAllForumPosts with recommendations", () => {
//     test("should return posts with recommendation metadata", async () => {
//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty("posts");
//       expect(res.body).toHaveProperty("totalPosts");
//       expect(res.body).toHaveProperty("currentPage");
//       expect(res.body).toHaveProperty("totalPages");
//       expect(res.body).toHaveProperty("recommendations");
//       expect(res.body).toHaveProperty("userTags");
//       expect(res.body.recommendations).toHaveProperty("contentBased");
//       expect(res.body.recommendations).toHaveProperty("popular");
//       expect(res.body.recommendations).toHaveProperty("trending");
//       expect(res.body.recommendations).toHaveProperty("recent");
//       expect(res.body.recommendations).toHaveProperty("collaborative");
//       expect(res.body.recommendations).toHaveProperty("random");
//     });

//     test("should return paginated results", async () => {
//       const res = await request(app)
//         .get("/api/forumpost/?page=1&limit=2")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeLessThanOrEqual(2);
//       expect(res.body.currentPage).toBe(1);
//     });

//     test("should include user search history in response", async () => {
//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.userTags).toContain("javascript");
//       expect(res.body.userTags).toContain("react");
//       expect(res.body.userTags).toContain("programming");
//     });

//     test("should prioritize content-based recommendations", async () => {
//       // Create a post that matches user's search history
//       const matchingPost = new ForumPost({
//         user_id: testUser._id,
//         title: "Advanced JavaScript Programming",
//         content: "Advanced JavaScript programming techniques...",
//         tags: ["javascript", "programming", "advanced"],
//         category: "technical",
//         engagement_score: 80
//       });
//       await matchingPost.save();

//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeGreaterThan(0);
      
//       // Check if the matching post is in the recommendations
//       const matchingPostFound = res.body.posts.some(post => 
//         post.title === "Advanced JavaScript Programming"
//       );
//       expect(matchingPostFound).toBe(true);

//       await ForumPost.findByIdAndDelete(matchingPost._id);
//     });

//     test("should include recommendation types for each post", async () => {
//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.posts.length).toBeGreaterThan(0);
      
//       // Check that posts have recommendationTypes property
//       res.body.posts.forEach(post => {
//         expect(post).toHaveProperty("recommendationTypes");
//         expect(Array.isArray(post.recommendationTypes)).toBe(true);
//       });
//     });
//   });

//   describe("POST /api/forumpost/:id/view - Increment view count", () => {
//     test("should increment view count", async () => {
//       const initialViews = testPost1.views;
      
//       const res = await request(app)
//         .post(`/api/forumpost/${testPost1._id}/view`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body).toHaveProperty("message", "View count updated");
//       expect(res.body.views).toBe(initialViews + 1);
//     });

//     test("should return 404 for non-existent post", async () => {
//       const fakeId = new mongoose.Types.ObjectId();
//       const res = await request(app)
//         .post(`/api/forumpost/${fakeId}/view`);

//       expect(res.statusCode).toBe(404);
//       expect(res.body).toHaveProperty("message", "Forum post not found");
//     });
//   });

//   describe("POST /api/forumpost/ - Create forum post with category", () => {
//     test("should create forum post with category", async () => {
//       const res = await request(app)
//         .post("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`)
//         .field("title", "Test Post with Category")
//         .field("content", "This is a test post with category")
//         .field("tags", "test,category")
//         .field("category", "academic")
//         .attach("images", path.join(__dirname, "test-assets/test.png"));

//       expect(res.statusCode).toBe(201);
//       expect(res.body).toHaveProperty("title", "Test Post with Category");
//       expect(res.body).toHaveProperty("category", "academic");
//       expect(res.body).toHaveProperty("engagement_score");
//       expect(res.body).toHaveProperty("views", 0);
//     });

//     test("should create forum post without category (defaults to general)", async () => {
//       const res = await request(app)
//         .post("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`)
//         .field("title", "Test Post without Category")
//         .field("content", "This is a test post without category")
//         .field("tags", "test,general");

//       expect(res.statusCode).toBe(201);
//       expect(res.body).toHaveProperty("title", "Test Post without Category");
//       expect(res.body).toHaveProperty("category", "general");
//     });
//   });

//   describe("Engagement score calculation", () => {
//     test("should calculate engagement score correctly", async () => {
//       const post = new ForumPost({
//         user_id: testUser._id,
//         title: "Engagement Test Post",
//         content: "Testing engagement score calculation",
//         tags: ["test", "engagement"],
//         category: "general",
//         likes: [testUser._id, new mongoose.Types.ObjectId()], // 2 likes
//         views: 10,
//         comments: [
//           {
//             user_id: testUser._id,
//             content: "Test comment",
//             created_at: new Date()
//           }
//         ] // 1 comment
//       });

//       await post.save();

//       // Engagement score = (likes * 2) + (comments * 3) + views
//       // = (2 * 2) + (1 * 3) + 10 = 4 + 3 + 10 = 17
//       expect(post.engagement_score).toBe(17);
//     });
//   });

//   describe("Recommendation algorithm integration", () => {
//     test("should combine multiple recommendation types", async () => {
//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.statusCode).toBe(200);
      
//       // Should have recommendations from multiple types
//       const totalRecommendations = Object.values(res.body.recommendations).reduce((sum, count) => sum + count, 0);
//       expect(totalRecommendations).toBeGreaterThan(0);
//     });

//     test("should handle empty search history gracefully", async () => {
//       // Create user with empty search history
//       const emptyUser = new User({
//         name: "Empty User",
//         email: "emptyuser@example.com",
//         password: "test123456",
//         role: "student",
//         profile_picture: "test-profile.jpg",
//         search_history: []
//       });
//       await emptyUser.save();

//       const loginResponse = await request(app)
//         .post("/api/user/login")
//         .send({
//           email: "emptyuser@example.com",
//           password: "test123456",
//         });
//       const emptyUserToken = loginResponse.body.token;

//       const res = await request(app)
//         .get("/api/forumpost/")
//         .set("Authorization", `Bearer ${emptyUserToken}`);

//       expect(res.statusCode).toBe(200);
//       expect(res.body.userTags).toEqual([]);
//       expect(res.body.posts.length).toBeGreaterThan(0);

//       await User.deleteOne({ email: "emptyuser@example.com" });
//     });
//   });
// }); 