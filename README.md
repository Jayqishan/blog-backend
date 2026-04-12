# Blog App - Backend

Node.js + Express + MongoDB REST API

## Setup

1. Install dependencies:
```
npm install
```

2. Create `.env` file:
```
DATABASE_URL=your_mongodb_url
PORT=4005
JWT_SECRET=your_jwt_secret
ADMIN_SIGNUP_SECRET=your_admin_signup_code
ADMIN_EMAIL=admin@blogspace.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

3. Run:
```
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/posts | Get paginated posts with optional `search`, `page`, `limit` |
| GET | /api/v1/posts/:id | Get one post |
| POST | /api/v1/posts/create | Create post |
| POST | /api/v1/comments/create | Add comment |
| POST | /api/v1/likes/like | Like a post |
| POST | /api/v1/likes/unlike | Unlike a post |
| POST | /api/v1/ai/generate | Generate AI writing suggestions with Gemini |
