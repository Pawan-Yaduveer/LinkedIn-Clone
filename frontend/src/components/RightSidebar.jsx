import React, { useEffect, useState } from 'react'
import { getUsers, connectUser } from '../api'
import { refreshCurrentUser } from '../utils/user'
import { Link } from 'react-router-dom'

export default function RightSidebar({ currentUser }){
  const [users, setUsers] = useState([]);
  const [connecting, setConnecting] = useState({});

  useEffect(()=>{
    let cancelled = false;
    async function load(){
      try{
        const res = await getUsers();
        if(!cancelled) setUsers(res.data || []);
      }catch(err){
        if(!cancelled) console.error('Failed to load users', err);
      }
    }
    // Delay first fetch just enough to ensure token header is set if login happened this render cycle
    const t = setTimeout(load, 50);
    return () => { cancelled = true; clearTimeout(t); };
  }, [currentUser]);

  async function handleConnect(id){
    try{
      setConnecting(c => ({ ...c, [id]: true }));
      await connectUser(id);
      // refresh current user's profile from server for full consistency
      await refreshCurrentUser(currentUser);
      // remove connected user from suggestions list
      setUsers(prev => prev.filter(u => u._id !== id));
    }catch(err){
      console.error('connect failed', err);
    }finally{
      setConnecting(c => ({ ...c, [id]: false }));
    }
  }

  // filter out any users that are the current user
  const suggestions = users.filter(u => (currentUser?.id || currentUser?._id) !== (u._id || u.id));

  return (
    <div className="card">
      <h4 style={{margin:0}}>People you may know</h4>
      <div style={{marginTop:10}}>
        {suggestions.length === 0 && <div className="small">No suggestions yet — invite more users or disconnect someone to see new suggestions.</div>}
        {suggestions.map(u => (
          <div key={u._id} className="suggestion">
            <div className="meta">
              <img src={u.avatar ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${u.avatar}` : `https://i.pravatar.cc/40?u=${u._id}`} alt="p" />
              <div>
                <div style={{fontWeight:600}}><Link to={`/profile/${u._id}`}>{u.name}</Link></div>
                <div className="small">{u.bio || u.email} {u.mutualCount ? <span style={{marginLeft:8}}>• {u.mutualCount} mutual</span> : null}</div>
              </div>
            </div>
            <div>
              {u.connected ? (
                <button className="btn" style={{padding:'6px 8px', background:'#e6eefc', color:'#0a66c2'}} disabled>Connected</button>
              ) : (
                <button className="btn" style={{padding:'6px 8px'}} onClick={()=>handleConnect(u._id)} disabled={connecting[u._id]}>{connecting[u._id] ? 'Connecting...' : 'Connect'}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
