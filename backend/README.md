# Backend — Express API

This folder contains the server for the LinkedIn Clone. It's a small Express app that uses Mongoose to talk to MongoDB, issues JWTs for authentication, and uses multer to accept image uploads during development.

Environment
- Copy `backend/.env.example` to `backend/.env` and set the following values:
	- `MONGO_URI` — MongoDB connection string (Atlas or local)
	- `JWT_SECRET` — secret used to sign JWTs
	- `PORT` — optional, defaults to 5000

Run locally

```powershell
cd backend
npm install
copy .env.example .env
# edit .env and fill values
npm run dev
```

API overview (selected endpoints)
- `POST /api/auth/register` — register a new user (name, email, password)
- `POST /api/auth/login` — login, returns JWT + user profile
- `GET /api/posts` — list posts (latest first)
- `POST /api/posts` — create post (authenticated, form-data: text, optional image)
- `POST /api/posts/:id/like` — like/unlike a post (authenticated)
- `PUT /api/posts/:id` — edit a post (authenticated owner)
- `DELETE /api/posts/:id` — delete a post (authenticated owner)
- `GET /api/users/:id` — public profile and that user's posts
- `PUT /api/users/:id` — update profile (authenticated owner, supports avatar upload)
- `DELETE /api/users/:id` — delete account (authenticated owner, removes posts and avatar)

Uploads
- During development uploaded files are saved to `backend/uploads` and served statically at `/uploads`.

Notes & recommendations
- This code is intended for learning. For production you'd want to:
	- Move file uploads to object storage (S3/GCS) and serve via CDN
	- Harden authentication and rate-limit sensitive endpoints
	- Add more robust error handling and logging
	- Add integration tests for critical flows (auth, posts, delete)

If you run into issues, check the console where `npm run dev` is running — most errors (missing env vars, Mongo connection issues) will be printed there.
