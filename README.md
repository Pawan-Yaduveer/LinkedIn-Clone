# LinkedIn Clone — full-stack sample

This repository is a small, educational LinkedIn-like application built with React (Vite) on the front end and Node/Express + MongoDB on the back end. It's intended as a learning project and a starting point for experimentation — features include user authentication, posting (with optional image upload), likes, comments, basic profiles, and simple connections between users.

Outline
- `backend/` — Express API (Mongoose + MongoDB, JWT auth, multer file uploads)
- `frontend/` — React app bootstrapped with Vite

Quick start (development)

1. Backend

	```powershell
	cd backend
	npm install
	copy .env.example .env   # on Windows PowerShell
	# Edit .env and set MONGO_URI and JWT_SECRET
	npm run dev
	```

2. Frontend

	```powershell
	cd frontend
	npm install
	copy .env.example .env   # set VITE_API_URL if needed
	npm run dev
	```

Notes
- Backend serves uploaded images from `/uploads` during development.
- For production, replace local file uploads with cloud storage (S3, etc.) and secure env management.

If anything fails when starting, check that your `.env` values are correct and that MongoDB is reachable. See the READMEs inside `backend/` and `frontend/` for more detailed instructions.
