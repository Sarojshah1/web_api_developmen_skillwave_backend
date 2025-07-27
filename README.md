# SkillWave Backend

A robust, scalable backend for a modern E-Learning platform, SkillWave, supporting real-time communication, collaborative learning, assessments, payments, and a smart forum recommendation system.

---

## 🚀 Features

- **User Management**: Registration, authentication (JWT), roles (student, tutor, admin), profile management
- **Course Management**: CRUD for courses, lessons, categories, and content
- **Assessment System**: Quizzes, questions, user quiz results, and review system
- **Forum System**: Community posts, comments, likes, and a powerful recommendation engine
- **Real-time Communication**: Video calling, chat, group study, and screen sharing via Socket.IO
- **Payment Integration**: Secure payment processing and enrollment
- **Certificate Generation**: Automated certificate creation for course completion
- **File Management**: Upload and manage course materials, profile pictures, and more
- **Collaborative Learning**: Group study sessions, group projects
- **Comprehensive Testing**: Unit, integration, and end-to-end tests

---

## 🛠️ Tech Stack

- **Node.js** (Express.js)
- **MongoDB** (Mongoose ODM)
- **Socket.IO** (real-time features)
- **JWT** (authentication)
- **Multer** (file uploads)
- **Jest** (testing)
- **Winston** (logging)

---

## 📁 Project Structure

```
SkillWave-Backend/
├── config/           # Configuration files
├── controllers/      # Route controllers (business logic)
├── docs/             # Documentation (API, forum system, etc.)
├── logs/             # Application logs
├── middlewares/      # Express middlewares (auth, uploads, etc.)
├── models/           # Mongoose models (User, Course, ForumPost, etc.)
├── public/           # Static files (uploads, images)
├── routes/           # Express route definitions
├── scripts/          # Utility scripts
├── tests/            # Unit, integration, and e2e tests
├── utils/            # Utility functions (e.g., socket.js)
├── index.js          # Main entry point
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

---

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SkillWave-Backend
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secrets, etc.
   ```
4. **Start the server**
   ```bash
   # Development
   npm run dev
   # Production
   npm start
   ```

---

## 📡 API Overview

- All endpoints are prefixed with `/api/`
- **Authentication**: JWT required for most endpoints
- **Full API details**: See [`docs/API.md`](docs/API.md)

### Main Modules & Endpoints

- **User**
  - `POST   /api/user/register` — Register a new user
  - `POST   /api/user/login` — User login
  - `GET    /api/user/profile` — Get user profile
  - `PUT    /api/user/profile` — Update user profile

- **Course**
  - `POST   /api/courses/` — Create course
  - `GET    /api/courses/` — List all courses
  - `GET    /api/courses/:id` — Get course by ID
  - `PUT    /api/courses/:id` — Update course
  - `DELETE /api/courses/:id` — Delete course
  - `POST   /api/courses/:id/enroll` — Enroll in course

- **Lesson**
  - `POST   /api/lesson/` — Create lesson
  - `GET    /api/lesson/:id` — Get lesson by ID
  - `PUT    /api/lesson/:id` — Update lesson
  - `DELETE /api/lesson/:id` — Delete lesson

- **Quiz**
  - `POST   /api/quiz/` — Create quiz
  - `GET    /api/quiz/:id` — Get quiz by ID
  - `POST   /api/quiz/:id/submit` — Submit quiz
  - `GET    /api/quiz/:id/results` — Get quiz results

- **Review**
  - `POST   /api/review/` — Add review
  - `GET    /api/review/:courseId` — Get reviews for course
  - `PUT    /api/review/:id` — Update review
  - `DELETE /api/review/:id` — Delete review

- **Forum**
  - `POST   /api/forumpost/` — Create forum post
  - `GET    /api/forumpost/` — List/recommend posts
  - `GET    /api/forumpost/:id` — Get post by ID
  - `POST   /api/forumpost/:id/comment` — Add comment
  - `POST   /api/forumpost/:id/like` — Like post

- **Blog**
  - `POST   /api/blog/` — Create blog
  - `GET    /api/blog/` — List blogs
  - `GET    /api/blog/:id` — Get blog by ID
  - `PUT    /api/blog/:id` — Update blog
  - `DELETE /api/blog/:id` — Delete blog

- **Category**
  - `POST   /api/category/` — Create category
  - `GET    /api/category/` — List categories
  - `PUT    /api/category/:id` — Update category
  - `DELETE /api/category/:id` — Delete category

- **Enrollment**
  - `POST   /api/enrollment/` — Enroll in course
  - `GET    /api/enrollment/` — Get user enrollments

- **Group Study**
  - `POST   /api/groupstudy/` — Create group
  - `GET    /api/groupstudy/` — List groups
  - `POST   /api/groupstudy/:id/join` — Join group

- **Certificate**
  - `POST   /api/certificate/` — Generate certificate
  - `GET    /api/certificate/` — List certificates

- **Payment**
  - `POST   /api/payment/initiate` — Initiate payment
  - `POST   /api/payment/verify` — Verify payment

> **See [`docs/API.md`](docs/API.md) for full details and request/response examples.**

---

## 🧠 Forum Recommendation System

The forum module features an advanced recommendation engine that:
- Suggests posts based on your search history, interests, and engagement
- Combines content-based, collaborative, trending, popular, recent, and random strategies
- Returns posts with metadata explaining why each was recommended
- All in a single endpoint: `GET /api/forumpost/`

**How it works:**
- [Read the full documentation here →](docs/ForumRecommendationSystem.md)
- Each post includes a `recommendationTypes` array (e.g., `["contentBased", "popular"]`)
- Posts are ranked by a weighted score (content-based: 5, popular: 4, trending: 3, recent: 2, collaborative: 1, random: 0.5)
- Engagement score: `(Likes × 2) + (Comments × 3) + Views`
- Supports pagination, filtering, and view tracking

---

## 💬 Real-Time Features (Socket.IO)

- **Video Calling & WebRTC**: Join rooms, send offers/answers, ICE candidates
- **Chat**: Real-time messaging, typing indicators
- **Group Study**: Join/leave rooms, see participants
- **Media Controls**: Toggle audio/video, screen sharing

**Example:**
```js
const socket = io('http://localhost:3000');
socket.emit('joinRoom', { context_id: 'roomId', userId: 'userId' });
socket.on('joinedRoom', (data) => console.log('Joined room:', data));
```

---

## 🧪 Testing

- **Run all tests:**
  ```bash
  npm test
  ```
- **Watch mode:**
  ```bash
  npm run test:watch
  ```
- **Coverage:**
  ```bash
  npm run test:coverage
  ```
- **Test files:** Located in `tests/` (unit, integration, e2e)

---

## 📚 Documentation

- **API Reference:** [`docs/API.md`](docs/API.md)
- **Forum Recommendation System:** [`docs/ForumRecommendationSystem.md`](docs/ForumRecommendationSystem.md)

---

## 🤝 Contributing

Pull requests and issues are welcome! Please see the [contributing guidelines](CONTRIBUTING.md) if available.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙋‍♂️ Contact

For questions, suggestions, or support, please open an issue or contact the maintainer.