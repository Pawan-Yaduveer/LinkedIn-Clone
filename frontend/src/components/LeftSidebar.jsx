import React from 'react'
import { Link } from 'react-router-dom'

export default function LeftSidebar({ user }){
  const userId = user?.id || user?._id;
  return (
    <div className="card profile-card">
      {user?.avatar ? <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${user.avatar}`} alt="avatar" /> : <div style={{width:88, height:88, borderRadius:44, background:'#ddd'}} />}
      <h3>{user?.name}</h3>
      <p className="small">{user?.email}</p>
      <div style={{width:'100%', marginTop:12}}>
        <Link to={`/profile/${userId}`} style={{display:'block', padding:'8px 10px', borderRadius:6, color:'#0a66c2'}}>View profile</Link>
        <div style={{display:'block', padding:'8px 10px', borderRadius:6, color:'#333'}}>Connections <span className="small" style={{marginLeft:8}}>({user?.connections?.length || 0})</span></div>
      </div>
    </div>
  )
}
