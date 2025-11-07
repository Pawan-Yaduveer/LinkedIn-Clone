import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';


export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 960 : false));


  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

 
  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand"><Link to="/">LinkedIn Clone</Link></h1>
        <div className="search">
          <input type="search" aria-label="Search" placeholder="Search" />
        </div>
      </div>

      {user && (
        <div className="topbar-center">
          <nav>
            <NavLink end to="/" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Home</NavLink>
            <NavLink to="/network" className={({isActive})=>"nav-link" + (isActive?" active":"")}>My Network</NavLink>
            <NavLink to="/jobs" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Jobs</NavLink>
            <NavLink to="/messages" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Messages</NavLink>
            <NavLink to={`/profile/${user.id || user._id}`} className={({isActive})=>"nav-link" + (isActive?" active":"")}>Profile</NavLink>
          </nav>
        </div>
      )}

      <div className="topbar-right">
        {user ? (
          <>
            {isMobile && (
              <button className="btn outline sm icon menu-btn" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu" aria-expanded={menuOpen} aria-controls="mobile-menu" title="Menu">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              </button>
            )}
            <Link to={`/profile/${user.id || user._id}`} className="profile-link">
              {user.avatar ? <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${user.avatar}`} alt="avatar" className="avatar" /> : <div className="avatar placeholder" />}
              <span className="username">{user.name}</span>
            </Link>
            <button className="btn outline sm icon" onClick={onLogout} aria-label="Logout" title="Logout">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
              <span style={{marginLeft:6}}>Logout</span>
            </button>
          </>
        ) : (
          <div style={{display:'flex', gap:12}}>
            <NavLink to="/login" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Login</NavLink>
            <NavLink to="/signup" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Signup</NavLink>
          </div>
        )}
      </div>

      {user && isMobile && menuOpen && (
        <div id="mobile-menu" className="mobile-menu" role="menu">
          <NavLink end to="/" role="menuitem" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Home</NavLink>
          <NavLink to="/network" role="menuitem" className={({isActive})=>"nav-link" + (isActive?" active":"")}>My Network</NavLink>
          <NavLink to="/jobs" role="menuitem" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Jobs</NavLink>
          <NavLink to="/messages" role="menuitem" className={({isActive})=>"nav-link" + (isActive?" active":"")}>Messages</NavLink>
          <hr style={{border:'none', borderTop:'1px solid #eee', margin:'8px 0'}} />
          <Link to={`/profile/${user.id || user._id}`} role="menuitem" className="nav-link">Profile</Link>
          <button className="btn secondary sm" role="menuitem" onClick={onLogout}>Logout</button>
        </div>
      )}
    </header>
  );
}
