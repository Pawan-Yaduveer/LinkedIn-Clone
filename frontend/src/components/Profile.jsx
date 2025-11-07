import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile, updateProfile, connectUser, disconnectUser, deleteUser, setTokenHeader } from '../api'
import { refreshCurrentUser } from '../utils/user'
import { useNavigate } from 'react-router-dom'
import PostItem from './PostItem'

export default function Profile({ currentUser }){
  const params = useParams();
  const userId = params?.id || currentUser?.id;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  async function load(){
    const res = await getProfile(userId);
    setProfile(res.data.user);
    setPosts(res.data.posts || []);
    setName(res.data.user?.name || '');
    setBio(res.data.user?.bio || '');
  }

  useEffect(()=>{ if(userId) load(); }, [userId]);

  // Build preview URL for newly selected avatar when editing
  useEffect(()=>{
    if (!avatar) { setAvatarPreview(null); return; }
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const isMe = currentUser && ((currentUser.id || currentUser._id) === (profile?._id || profile?.id));
  const [connecting, setConnecting] = useState(false);

  async function handleConnect(){
    if(!currentUser) return;
    setConnecting(true);
    try{
      await connectUser(profile._id);
      // refresh profile and current user
      await load();
      await refreshCurrentUser(currentUser);
    }catch(err){ console.error(err); }
    setConnecting(false);
  }

  async function handleDisconnect(){
    if(!currentUser) return;
    setConnecting(true);
    try{
      await disconnectUser(profile._id);
      await load();
      await refreshCurrentUser(currentUser);
    }catch(err){ console.error(err); }
    setConnecting(false);
  }

  async function save(e){
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', name);
    fd.append('bio', bio);
    if (avatar) fd.append('avatar', avatar);
    const res = await updateProfile(userId, fd);
    setProfile(res.data.user);
    // if the current user updated their own profile, update localStorage so sidebars/topbar reflect changes
    if (currentUser && (currentUser.id === (res.data.user.id || res.data.user._id) || currentUser._id === (res.data.user.id || res.data.user._id))) {
      const updated = { ...currentUser, name: res.data.user.name, avatar: res.data.user.avatar };
      localStorage.setItem('user', JSON.stringify(updated));
      // notify app to update in-memory user state
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updated })); } catch(e){}
    }
    setEditing(false);
  }

  const navigate = useNavigate();

  async function handleDelete(){
    if(!isMe) return;
    if(!window.confirm('Delete your account? This action is irreversible and will remove your posts.')) return;
    try{
      await deleteUser(userId);
      // clear local storage and auth token, then redirect to signup
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  try{ setTokenHeader(null); }catch(e){}
      try{ window.dispatchEvent(new CustomEvent('profileUpdated', { detail: null })); }catch(e){}
      navigate('/signup');
    }catch(err){
      console.error('Failed to delete account', err);
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  }

  if (!profile) return <div className="card">Loading...</div>

  return (
    <div>
      <div className="card" style={{display:'flex', gap:12}}>
        <div>
          {profile.avatar ? (
            <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${profile.avatar}`} alt="avatar" className="avatar-lg" />
          ) : (
            <div className="avatar-lg placeholder" />
          )}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div>
              <h3>{profile.name}</h3>
              <div className="small">{profile.email}</div>
            </div>
            <div>
              {isMe ? (
                <button onClick={()=>setEditing(true)} className="btn outline sm icon" aria-label="Edit profile" title="Edit profile">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                  Edit
                </button>
              ) : (
                <>
                  {profile.connections && profile.connections.find(c => (currentUser?.id || currentUser?._id) === (c || '').toString()) ? (
                    <button onClick={handleDisconnect} disabled={connecting} className="btn secondary sm icon" aria-label="Disconnect" title="Disconnect">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h6v2H3V8zm12 0h6v2h-6V8z" /><path d="M9 8a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0V8z" /></svg>
                      {connecting ? 'Working...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button onClick={handleConnect} disabled={connecting} className="btn sm icon" aria-label="Connect" title="Connect">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 12h8" /><path d="M12 8v8" /><circle cx="12" cy="12" r="9" /></svg>
                      {connecting ? 'Working...' : 'Connect'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{marginTop:8}}>{profile.bio || <span className="small">No bio yet</span>}</div>
        </div>
      </div>

      {editing && (
        <div className="card">
          <h4>Edit profile</h4>
          <form onSubmit={save}>
            <div className="form-row" style={{display:'flex', gap:12, alignItems:'center'}}>
              {(avatarPreview || profile.avatar) ? (
                <img src={avatarPreview || `${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${profile.avatar}`} alt="avatar preview" className="avatar-lg" />
              ) : (
                <div className="avatar-lg placeholder" />
              )}
            </div>
            <div className="form-row"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" /></div>
            <div className="form-row"><textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)} /></div>
            <div className="form-row" style={{display:'flex', gap:10, alignItems:'center'}}>
              <label className="file-btn">Choose avatar<input className="file-input" type="file" accept="image/*" onChange={e=>setAvatar(e.target.files[0])} /></label>
            </div>
            <div className="form-row">
              <button className="btn sm icon" aria-label="Save profile" title="Save">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12l5 5L20 7" /></svg>
                Save
              </button>
              <button onClick={()=>setEditing(false)} className="btn secondary sm icon" style={{marginLeft:8}} aria-label="Cancel editing" title="Cancel">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn danger sm icon" style={{marginLeft:12}} aria-label="Delete account" title="Delete account">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                Delete
              </button>
            </div>
          </form>
        </div>
      )}

      <h4 style={{marginTop:12}}>Posts by {profile.name}</h4>
      {posts.map(p => (
        <PostItem key={p._id} post={p} onRefresh={load} currentUser={currentUser} />
      ))}
    </div>
  )
}
