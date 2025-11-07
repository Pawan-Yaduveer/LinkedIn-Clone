import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'

export default function Signup({ onSuccess }){
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function submit(e){
    e.preventDefault(); setError(null);
    try{
      const res = await register({ name, email, password });
      onSuccess(res.data);
      navigate('/');
    }catch(err){
      setError(err.response?.data?.message || 'Signup failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand"><Link to="/" className="brand">LinkedIn Clone</Link></div>
      <div className="auth-card card">
        <h2>Create your account</h2>
        <p className="small">Join your professional community</p>
        <form onSubmit={submit} style={{marginTop:12}}>
          <div className="form-row"><input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="form-row"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="form-row"><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
            <button className="btn">Sign up</button>
            <a href="#" className="small">Have an account?</a>
          </div>
          {error && <div className="small" style={{color:'red', marginTop:8}}>{error}</div>}
        </form>
        <div className="auth-cta">
          <span className="small">Already have an account?</span> <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}

