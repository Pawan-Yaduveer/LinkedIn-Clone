import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile, updateProfile, connectUser, disconnectUser, deleteUser, setTokenHeader } from '../api'
import { useNavigate } from 'react-router-dom'
import PostItem from './PostItem'

export default function Profile({ currentUser, match }){
  const params = useParams();
  const userId = params?.id || currentUser?.id;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);

  async function load(){
    const res = await getProfile(userId);
    setProfile(res.data.user);
    setPosts(res.data.posts || []);
    setName(res.data.user?.name || '');
    setBio(res.data.user?.bio || '');
  }

  useEffect(()=>{ if(userId) load(); }, [userId]);

  const isMe = currentUser && ((currentUser.id || currentUser._id) === (profile?._id || profile?.id));
  const [connecting, setConnecting] = useState(false);

  async function handleConnect(){
    if(!currentUser) return;
    setConnecting(true);
    try{
      await connectUser(profile._id);
      // refresh profile and current user
      await load();
      const meId = currentUser?.id || currentUser?._id;
      if(meId){
        const rsp = await getProfile(meId);
        localStorage.setItem('user', JSON.stringify(rsp.data.user));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: rsp.data.user }));
      }
    }catch(err){ console.error(err); }
    setConnecting(false);
  }

  async function handleDisconnect(){
    if(!currentUser) return;
    setConnecting(true);
    try{
      await disconnectUser(profile._id);
      await load();
      const meId = currentUser?.id || currentUser?._id;
      if(meId){
        const rsp = await getProfile(meId);
        localStorage.setItem('user', JSON.stringify(rsp.data.user));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: rsp.data.user }));
      }
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
          {profile.avatar ? <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${profile.avatar}`} alt="avatar" style={{width:80, height:80, borderRadius:40}} /> : <div style={{width:80, height:80, borderRadius:40, background:'#ddd'}} />}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div>
              <h3>{profile.name}</h3>
              <div className="small">{profile.email}</div>
            </div>
            <div>
              {isMe ? (
                <button onClick={()=>setEditing(true)}>Edit profile</button>
              ) : (
                <>
                  {profile.connections && profile.connections.find(c => (currentUser?.id || currentUser?._id) === (c || '').toString()) ? (
                    <button onClick={handleDisconnect} disabled={connecting}>{connecting ? 'Working...' : 'Disconnect'}</button>
                  ) : (
                    <button onClick={handleConnect} disabled={connecting}>{connecting ? 'Working...' : 'Connect'}</button>
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
            <div className="form-row"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" /></div>
            <div className="form-row"><textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)} /></div>
            <div className="form-row"><input type="file" onChange={e=>setAvatar(e.target.files[0])} /></div>
            <div className="form-row">
              <button className="btn">Save</button>
              <button onClick={()=>setEditing(false)} style={{marginLeft:8}}>Cancel</button>
              <button onClick={handleDelete} style={{marginLeft:12, background:'#ef4444', border:'none', color:'#fff', padding:'8px 12px', borderRadius:6}}>Delete account</button>
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
