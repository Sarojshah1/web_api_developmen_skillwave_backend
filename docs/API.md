# API Documentation

Welcome to the SkillWave API Reference! This document provides a comprehensive guide to all REST API endpoints, request/response formats, authentication, and usage for the SkillWave backend.

---

## 📑 Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-1)
  - [Users](#users)
  - [Courses](#courses)
  - [Lessons](#lessons)
  - [Quizzes](#quizzes)
  - [Reviews](#reviews)
  - [Forum Posts](#forum-posts)
  - [Blogs](#blogs)
  - [Categories](#categories)
  - [Enrollments](#enrollments)
  - [Group Study](#group-study)
  - [Certificates](#certificates)
  - [Payments](#payments)
- [Pagination](#paginated-response)
- [Error Handling](#error-response)

---

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /user/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "jwt_token"
  }
}
```

#### Login User
```http
POST /user/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "jwt_token"
  }
}
```

### Users

#### Get User Profile
```http
GET /user/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "profile_picture": "url_to_image",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /user/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "profile_picture": "new_image_url"
}
```

### Courses

#### Get All Courses
```http
GET /courses?page=1&limit=10&category=category_id&creator=user_id
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `category` (optional): Filter by category ID
- `creator` (optional): Filter by creator ID

**Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "course_id",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript basics",
      "price": 99.99,
      "category": "category_id",
      "creator": "user_id",
      "thumbnail": "thumbnail_url",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Create Course
```http
POST /courses
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
title: "JavaScript Fundamentals"
description: "Learn JavaScript basics"
price: 99.99
category: "category_id"
thumbnail: [file]
```

#### Get Course by ID
```http
GET /courses/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "_id": "course_id",
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript basics",
    "price": 99.99,
    "category": {
      "_id": "category_id",
      "name": "Programming"
    },
    "creator": {
      "_id": "user_id",
      "name": "John Doe"
    },
    "lessons": [
      {
        "_id": "lesson_id",
        "title": "Introduction to JavaScript",
        "duration": 30
      }
    ],
    "thumbnail": "thumbnail_url",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Lessons

#### Get Lessons
```http
GET /lesson?course=course_id&page=1&limit=10
```

#### Create Lesson
```http
POST /lesson
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
title: "Introduction to JavaScript"
description: "Learn the basics of JavaScript"
course: "course_id"
video: [file]
duration: 30
```

### Categories

#### Get All Categories
```http
GET /category
```

#### Create Category
```http
POST /category
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
name: "Programming"
description: "Programming courses"
icon: [file]
```

### Quizzes

#### Get Quizzes
```http
GET /quiz?course=course_id&page=1&limit=10
```

#### Create Quiz
```http
POST /quiz
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "JavaScript Quiz",
  "description": "Test your JavaScript knowledge",
  "course": "course_id",
  "questions": [
    {
      "question": "What is JavaScript?",
      "options": ["Programming language", "Markup language", "Style language"],
      "correctAnswer": 0
    }
  ],
  "timeLimit": 30
}
```

### Enrollments

#### Get User Enrollments
```http
GET /enroll?user=user_id&status=active&page=1&limit=10
```

#### Enroll in Course
```http
POST /enroll
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "course": "course_id"
}
```

### Reviews

#### Get Course Reviews
```http
GET /review?course=course_id&page=1&limit=10
```

#### Create Review
```http
POST /review
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "course": "course_id",
  "rating": 5,
  "comment": "Great course!"
}
```

### Group Study

#### Get Group Studies
```http
GET /groupstudy?page=1&limit=10
```

#### Create Group Study
```http
POST /groupstudy
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "JavaScript Study Group",
  "description": "Let's learn JavaScript together",
  "maxMembers": 10,
  "course": "course_id"
}
```

### Forum Posts

#### Get Forum Posts
```http
GET /post?page=1&limit=10
```

#### Create Forum Post
```http
POST /post
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "JavaScript Question",
  "content": "I have a question about JavaScript...",
  "tags": ["javascript", "help"]
}
```

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:3000');
```

### Room Management

#### Join Room
```javascript
socket.emit('joinRoom', {
  context_id: 'group_study_id',
  userId: 'user_id'
});

socket.on('joinedRoom', (data) => {
  console.log('Joined room:', data);
});
```

#### Leave Room
```javascript
socket.emit('leaveRoom', {
  context_id: 'group_study_id',
  userId: 'user_id'
});
```

### WebRTC (Video Calling)

#### Send Offer
```javascript
socket.emit('offer', {
  offer: rtcOffer,
  context_id: 'group_study_id',
  userId: 'user_id',
  targetSocketId: 'target_socket_id' // optional
});

socket.on('offer', (data) => {
  console.log('Received offer:', data);
});
```

#### Send Answer
```javascript
socket.emit('answer', {
  answer: rtcAnswer,
  context_id: 'group_study_id',
  userId: 'user_id',
  targetSocketId: 'target_socket_id' // optional
});
```

#### Send ICE Candidate
```javascript
socket.emit('ice-candidate', {
  candidate: iceCandidate,
  context_id: 'group_study_id',
  userId: 'user_id',
  targetSocketId: 'target_socket_id' // optional
});
```

### Media Control

#### Toggle Audio
```javascript
socket.emit('toggleAudio', {
  context_id: 'group_study_id',
  userId: 'user_id',
  isMuted: true
});

socket.on('audioToggled', (data) => {
  console.log('Audio toggled:', data);
});
```

#### Toggle Video
```javascript
socket.emit('toggleVideo', {
  context_id: 'group_study_id',
  userId: 'user_id',
  isVideoOff: false
});
```

#### Toggle Screen Share
```javascript
socket.emit('toggleScreenShare', {
  context_id: 'group_study_id',
  userId: 'user_id',
  isScreenSharing: true
});
```

### Chat

#### Send Message
```javascript
socket.emit('sendMessage', {
  context_id: 'group_study_id',
  userId: 'user_id',
  message: 'Hello everyone!',
  messageType: 'text' // optional, default: 'text'
});

socket.on('newMessage', (data) => {
  console.log('New message:', data);
});
```

#### Typing Indicators
```javascript
socket.emit('typing', 'group_study_id', 'user_id');

socket.emit('stopTyping', {
  context_id: 'group_study_id',
  userId: 'user_id'
});

socket.on('userTyping', (userId) => {
  console.log('User typing:', userId);
});

socket.on('userStoppedTyping', (data) => {
  console.log('User stopped typing:', data);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Limits may vary by endpoint and user role.

## File Upload

Supported file types:
- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM, OGG
- **Documents**: PDF, DOC, DOCX

Maximum file size: 50MB 