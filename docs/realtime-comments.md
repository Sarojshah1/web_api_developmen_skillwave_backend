# Real-Time Comments for Forum Posts

This document describes the implementation of real-time comments for forum posts using Socket.IO.

## Features

- Real-time comment creation and updates
- Real-time reply functionality
- Typing indicators for comments and replies
- Automatic room management for each forum post
- User presence tracking

## Socket Events

### Client to Server Events

#### Join Forum Post Room
```javascript
socket.emit('joinForumPost', { postId: 'post_id', userId: 'user_id' });
```

#### Leave Forum Post Room
```javascript
socket.emit('leaveForumPost', { postId: 'post_id', userId: 'user_id' });
```

#### Comment Typing Indicator
```javascript
socket.emit('commentTyping', { postId: 'post_id', userId: 'user_id', isTyping: true });
```

#### Reply Typing Indicator
```javascript
socket.emit('replyTyping', { 
  postId: 'post_id', 
  commentId: 'comment_id', 
  userId: 'user_id', 
  isTyping: true 
});
```

### Server to Client Events

#### New Comment
```javascript
socket.on('new-comment', (data) => {
  console.log('New comment:', data);
  // data contains: { postId, comment, post }
});
```

#### New Reply
```javascript
socket.on('new-reply', (data) => {
  console.log('New reply:', data);
  // data contains: { postId, commentId, reply, post }
});
```

#### User Comment Typing
```javascript
socket.on('userCommentTyping', (data) => {
  console.log('User typing comment:', data);
  // data contains: { postId, userId, isTyping }
});
```

#### User Reply Typing
```javascript
socket.on('userReplyTyping', (data) => {
  console.log('User typing reply:', data);
  // data contains: { postId, commentId, userId, isTyping }
});
```

#### Joined Forum Post Room
```javascript
socket.on('joinedForumPost', (data) => {
  console.log('Joined forum post room:', data);
  // data contains: { postId, userId }
});
```

## API Endpoints

### Add Comment
```http
POST /api/post/:id/comments
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "This is a comment"
}
```

### Add Reply
```http
POST /api/post/:postId/comments/:commentId/replies
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "This is a reply"
}
```

### Get Comments
```http
GET /api/post/:id/comments
Authorization: Bearer <token>
```

## Frontend Implementation Example

### React Component Example

```javascript
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const ForumPostComments = ({ postId, userId }) => {
  const [socket, setSocket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    // Connect to socket
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Join forum post room
    newSocket.emit('joinForumPost', { postId, userId });

    // Listen for new comments
    newSocket.on('new-comment', (data) => {
      if (data.postId === postId) {
        setComments(prev => [...prev, data.comment]);
      }
    });

    // Listen for new replies
    newSocket.on('new-reply', (data) => {
      if (data.postId === postId) {
        setComments(prev => 
          prev.map(comment => 
            comment._id === data.commentId 
              ? { ...comment, replies: [...comment.replies, data.reply] }
              : comment
          )
        );
      }
    });

    // Listen for typing indicators
    newSocket.on('userCommentTyping', (data) => {
      if (data.postId === postId && data.userId !== userId) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    });

    // Load existing comments
    fetchComments();

    return () => {
      newSocket.emit('leaveForumPost', { postId, userId });
      newSocket.disconnect();
    };
  }, [postId, userId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/post/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/post/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        setNewComment('');
        // Socket will handle the real-time update
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReplySubmit = async (commentId, replyContent) => {
    try {
      const response = await fetch(`/api/post/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: replyContent })
      });

      if (response.ok) {
        // Socket will handle the real-time update
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleCommentTyping = (isTyping) => {
    if (socket) {
      socket.emit('commentTyping', { postId, userId, isTyping });
    }
  };

  return (
    <div className="forum-comments">
      <h3>Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleCommentSubmit}>
        <textarea
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            handleCommentTyping(e.target.value.length > 0);
          }}
          placeholder="Write a comment..."
          onFocus={() => handleCommentTyping(true)}
          onBlur={() => handleCommentTyping(false)}
        />
        <button type="submit">Post Comment</button>
      </form>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} users are typing...`
          }
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment._id} className="comment">
            <div className="comment-header">
              <span className="author">{comment.user_id.name}</span>
              <span className="date">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="comment-content">{comment.content}</div>
            
            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="replies">
                {comment.replies.map(reply => (
                  <div key={reply._id} className="reply">
                    <div className="reply-header">
                      <span className="author">{reply.user_id.name}</span>
                      <span className="date">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="reply-content">{reply.content}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reply Form */}
            <ReplyForm 
              commentId={comment._id}
              onSubmit={(content) => handleReplySubmit(comment._id, content)}
              socket={socket}
              postId={postId}
              userId={userId}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Reply Form Component
const ReplyForm = ({ commentId, onSubmit, socket, postId, userId }) => {
  const [replyContent, setReplyContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleReplyTyping = (isTyping) => {
    if (socket) {
      socket.emit('replyTyping', { postId, commentId, userId, isTyping });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    onSubmit(replyContent);
    setReplyContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <input
        type="text"
        value={replyContent}
        onChange={(e) => {
          setReplyContent(e.target.value);
          handleReplyTyping(e.target.value.length > 0);
        }}
        placeholder="Write a reply..."
        onFocus={() => handleReplyTyping(true)}
        onBlur={() => handleReplyTyping(false)}
      />
      <button type="submit">Reply</button>
    </form>
  );
};

export default ForumPostComments;
```

### Vanilla JavaScript Example

```javascript
// Connect to socket
const socket = io('http://localhost:3000');

// Join forum post room
socket.emit('joinForumPost', { postId: 'post_id', userId: 'user_id' });

// Listen for new comments
socket.on('new-comment', (data) => {
  console.log('New comment received:', data);
  // Update UI with new comment
  addCommentToUI(data.comment);
});

// Listen for new replies
socket.on('new-reply', (data) => {
  console.log('New reply received:', data);
  // Update UI with new reply
  addReplyToUI(data.commentId, data.reply);
});

// Listen for typing indicators
socket.on('userCommentTyping', (data) => {
  console.log('User typing comment:', data);
  // Show typing indicator
  showTypingIndicator(data.userId, data.isTyping);
});

// Post a comment
async function postComment(content) {
  try {
    const response = await fetch(`/api/post/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    
    if (response.ok) {
      // Socket will handle the real-time update
      console.log('Comment posted successfully');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}

// Handle comment typing
function handleCommentTyping(isTyping) {
  socket.emit('commentTyping', { postId, userId, isTyping });
}
```

## Database Schema

The forum post model includes a nested comment schema:

```javascript
const commentSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  replies: [
    {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
```

## Security Considerations

1. **Authentication**: All comment and reply endpoints require authentication
2. **Authorization**: Users can only post comments/replies when authenticated
3. **Input Validation**: Content is validated on both client and server
4. **Rate Limiting**: Consider implementing rate limiting for comment posting
5. **Content Filtering**: Consider implementing content filtering for inappropriate content

## Performance Considerations

1. **Pagination**: Comments are paginated to handle large numbers
2. **Indexing**: Database indexes on frequently queried fields
3. **Caching**: Consider caching popular forum posts and comments
4. **Real-time Updates**: Only emit events to relevant users in the same room

## Error Handling

The system includes comprehensive error handling:

- Network errors during socket connections
- Database errors during comment operations
- Validation errors for comment content
- Authentication errors for protected endpoints

## Testing

To test the real-time functionality:

1. Start the server
2. Open multiple browser tabs/windows
3. Join the same forum post room
4. Post comments and replies
5. Verify real-time updates across all tabs

## Troubleshooting

### Common Issues

1. **Comments not appearing in real-time**
   - Check socket connection status
   - Verify room joining
   - Check server logs for errors

2. **Typing indicators not working**
   - Ensure socket events are properly emitted
   - Check client-side event listeners

3. **Performance issues with many comments**
   - Implement pagination
   - Consider virtual scrolling for large lists
   - Optimize database queries

### Debug Commands

```javascript
// Check socket connection
console.log('Socket connected:', socket.connected);

// Check room membership
socket.emit('getRoomParticipants', { context_id: postId, userId });

// Manual emit for testing
socket.emit('new-comment', { postId: 'test', comment: { content: 'test' } });
``` 