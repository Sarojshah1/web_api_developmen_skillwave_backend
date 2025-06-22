# Forum Post Recommendation System

## Overview

The forum post recommendation system is integrated into the main `getAllForumPosts` endpoint, providing intelligent content suggestions to users based on multiple algorithms and user behavior patterns. It combines content-based filtering, collaborative filtering, and engagement metrics to deliver personalized recommendations in a single API call.

## Features

### 1. Multiple Recommendation Algorithms (Integrated)

#### Content-Based Filtering
- Recommends posts based on user's search history and interests
- Matches posts by title, content, and tags
- Highest priority in the weighted system (Weight: 5)

#### Popular Posts
- Shows posts with high engagement scores
- Based on likes, comments, and views
- Weight: 4

#### Trending Posts
- Displays posts with recent activity (last 7 days)
- Includes posts with new comments or updates
- Weight: 3

#### Recent Posts
- Shows the latest posts chronologically
- Ensures users see fresh content
- Weight: 2

#### Collaborative Filtering
- Recommends posts from users with similar interests
- Based on like patterns and user behavior
- Weight: 1

#### Random Posts
- Provides content discovery through randomization
- Weight: 0.5

### 2. Engagement Scoring

The system calculates an engagement score for each post:
```
Engagement Score = (Likes × 2) + (Comments × 3) + Views
```

This helps prioritize high-quality, engaging content in recommendations.

### 3. Weighted Recommendations

The main feed combines all recommendation types with weights:
- Content-based: Weight 5 (highest priority)
- Popular: Weight 4
- Trending: Weight 3
- Recent: Weight 2
- Collaborative: Weight 1
- Random: Weight 0.5

## API Endpoints

### 1. Get All Posts with Integrated Recommendations
```
GET /api/forumpost/
Authorization: Bearer <token>
Query Parameters:
- page: Page number (default: 1)
- limit: Posts per page (default: 6)
```

**Response:**
```json
{
  "posts": [
    {
      "_id": "...",
      "title": "JavaScript Best Practices",
      "content": "...",
      "user_id": {...},
      "tags": ["javascript", "programming"],
      "category": "technical",
      "likes": [...],
      "views": 50,
      "engagement_score": 100,
      "recommendationTypes": ["contentBased", "popular"],
      "comments": [...],
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPosts": 50,
  "currentPage": 1,
  "totalPages": 9,
  "recommendations": {
    "contentBased": 15,
    "popular": 10,
    "trending": 8,
    "recent": 12,
    "collaborative": 5,
    "random": 3
  },
  "userTags": ["javascript", "react", "programming"]
}
```

### 2. Track Post Views
```
POST /api/forumpost/:id/view
```

**Response:**
```json
{
  "message": "View count updated",
  "views": 51
}
```

## Usage Examples

### Frontend Integration

```javascript
// Get posts with integrated recommendations
const getForumPosts = async (page = 1, limit = 6) => {
  const response = await fetch(`/api/forumpost/?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  // Access posts with recommendation metadata
  console.log('Posts:', data.posts);
  console.log('Recommendation stats:', data.recommendations);
  console.log('User tags:', data.userTags);
  
  return data;
};

// Track post view
const trackView = async (postId) => {
  await fetch(`/api/forumpost/${postId}/view`, {
    method: 'POST'
  });
};

// Display posts with recommendation indicators
const displayPosts = (posts) => {
  posts.forEach(post => {
    console.log(`Post: ${post.title}`);
    console.log(`Recommended because: ${post.recommendationTypes.join(', ')}`);
    console.log(`Engagement score: ${post.engagement_score}`);
  });
};
```

### Creating Posts with Categories

```javascript
// Create a post with category
const createPost = async (postData) => {
  const formData = new FormData();
  formData.append('title', postData.title);
  formData.append('content', postData.content);
  formData.append('tags', postData.tags.join(','));
  formData.append('category', postData.category); // academic, technical, social, etc.
  
  if (postData.images) {
    formData.append('images', postData.images);
  }

  const response = await fetch('/api/forumpost/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

## Categories

Posts can be categorized into the following types:
- `general`: General discussions
- `academic`: Academic-related posts
- `technical`: Technical discussions and tutorials
- `social`: Social interactions and community posts
- `announcement`: Important announcements
- `question`: Questions and help requests
- `discussion`: Open discussions

## Recommendation Types

Each post in the response includes a `recommendationTypes` array that shows why the post was recommended:

- `contentBased`: Matches user's search history or interests
- `popular`: High engagement score
- `trending`: Recent activity in the last 7 days
- `recent`: Recently created
- `collaborative`: From users with similar interests
- `random`: Randomly selected for discovery

## Best Practices

1. **Track User Behavior**: Call the view endpoint when users view posts to improve recommendations
2. **Use Categories**: Categorize posts appropriately for better content organization
3. **Add Relevant Tags**: Include meaningful tags to improve content-based filtering
4. **Encourage Engagement**: Likes and comments help improve post visibility in recommendations
5. **Monitor Recommendation Types**: Use the `recommendationTypes` to understand why posts are shown
6. **Leverage User Tags**: Use the `userTags` in the response to understand user preferences

## Performance Considerations

- All recommendations are calculated in a single API call
- The system automatically handles duplicate removal and ranking
- Engagement scores are updated automatically when posts are modified
- Consider implementing caching for frequently accessed recommendations
- The weighted scoring system ensures diverse content discovery

## Response Structure

### Posts Array
Each post object includes:
- Standard post fields (title, content, user_id, etc.)
- `engagement_score`: Calculated engagement metric
- `recommendationTypes`: Array of recommendation types for this post
- `views`: View count
- `category`: Post category

### Metadata
- `totalPosts`: Total number of posts available
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `recommendations`: Count of posts by recommendation type
- `userTags`: User's search history and interests

## Future Enhancements

- Machine learning-based recommendations
- User preference learning over time
- A/B testing for recommendation algorithms
- Real-time recommendation updates
- Cross-platform recommendation synchronization
- Personalized recommendation weights based on user behavior 