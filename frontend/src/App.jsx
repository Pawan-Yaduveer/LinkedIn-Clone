import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Feed from './components/Feed'
import Profile from './components/Profile'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import { setTokenHeader } from './api'

function TopBar({ user, onLogout }){
  const location = useLocation();

  // hide full navbar on auth pages (login/signup)
  if(location.pathname === '/login' || location.pathname === '/signup') return null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand"><Link to="/">LinkedIn Clone</Link></h1>
        <div className="search">
          <input placeholder="Search" />
        </div>
      </div>

      {user && (
        <div className="topbar-center">
          <nav>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/" className="nav-link">My Network</Link>
            <Link to="/" className="nav-link">Jobs</Link>
            <Link to="/" className="nav-link">Messages</Link>
          </nav>
        </div>
      )}

      <div className="topbar-right">
        {user ? (
          <>
            <Link to={`/profile/${user.id || user._id}`} className="profile-link">
              {user.avatar ? <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${user.avatar}`} alt="avatar" className="avatar" /> : <div className="avatar placeholder" />}
              <span className="username">{user.name}</span>
            </Link>
            <button className="btn logout" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Signup</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default function App(){
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => { setTokenHeader(token); }, [token]);

  // listen for profile updates (so topbar/left sidebar update immediately)
  useEffect(()=>{
    function onProfileUpdated(e){
      try{ setUser(e.detail); localStorage.setItem('user', JSON.stringify(e.detail)); }catch(e){}
    }
    window.addEventListener('profileUpdated', onProfileUpdated);
    return () => window.removeEventListener('profileUpdated', onProfileUpdated);
  }, []);

  function handleLogin({ user, token }){
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user); setToken(token);
  }
  function handleLogout(){
    localStorage.removeItem('user'); localStorage.removeItem('token');
    setUser(null); setToken(null);
  }

  return (
    <BrowserRouter>
      <div className="app">
        {user && <TopBar user={user} onLogout={handleLogout} />}
        <main>
          {user ? (
            <div className="layout">
              <aside className="left"><LeftSidebar user={user} /></aside>
              <section className="center">
                <Routes>
                  <Route path="/" element={<Feed currentUser={user} />} />
                  <Route path="/profile/:id" element={<Profile currentUser={user} />} />
                </Routes>
              </section>
              <aside className="right"><RightSidebar currentUser={user} /></aside>
            </div>
          ) : (
            <div style={{padding:20}}>
                <Routes>
                  <Route path="/login" element={<Login onSuccess={handleLogin} />} />
                  <Route path="/signup" element={<Signup onSuccess={handleLogin} />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
          )}
        </main>
      </div>
    </BrowserRouter>
  )
}
