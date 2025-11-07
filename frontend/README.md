# Frontend — React (Vite)

This folder contains the React single-page app for the LinkedIn Clone. It's built with Vite and uses `axios` to talk to the backend API.

Run locally

```powershell
cd frontend
npm install
copy .env.example .env
# edit .env (set VITE_API_URL if backend is hosted elsewhere)
npm run dev
```

Notes
- By default the frontend expects the backend at `http://localhost:5000` — change `VITE_API_URL` in `.env` if needed.
- Use the UI to register, login, create posts (with optional images), like/comment, and view profiles.

Developer tips
- If you change backend env or rebuild backend, restart the frontend so proxy/endpoint URLs update correctly.
- To rebuild dependencies:

```powershell
cd backend; npm install
cd ..\frontend; npm install
```

Feel free to customize styles in `src/index.css` and components under `src/components`.
