import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './components/Login'
import Signup from './components/Signup'
import Feed from './components/Feed'
import Profile from './components/Profile'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import { setTokenHeader } from './api'
// Simple placeholder pages for top nav so active states behave consistently
function Network(){ return <div className="card"><h3>My Network</h3><p>Connections and invitations will appear here.</p></div>; }
function Jobs(){ return <div className="card"><h3>Jobs</h3><p>Job recommendations and applications will appear here.</p></div>; }
function Messages(){ return <div className="card"><h3>Messages</h3><p>Your conversations will appear here.</p></div>; }

// Navbar component extracted to components/Navbar.jsx

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
    // Set auth header immediately to avoid race where children fetch before useEffect runs
    try { setTokenHeader(token); } catch {}
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user); setToken(token);
  }
  function handleLogout(){
    localStorage.removeItem('user'); localStorage.removeItem('token');
    try { setTokenHeader(null); } catch {}
    setUser(null); setToken(null);
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main>
          {user ? (
            <div className="layout">
              <aside className="left"><LeftSidebar user={user} /></aside>
              <section className="center">
                <Routes>
                  <Route path="/" element={<Feed currentUser={user} />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/messages" element={<Messages />} />
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
                  {/* Catch-all to avoid blank screen if user logs out on a protected route */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
          )}
        </main>
      </div>
    </BrowserRouter>
  )
}
