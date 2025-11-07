import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'

export default function Login({ onSuccess }){
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function submit(e){
    e.preventDefault(); setError(null);
    try{
      const res = await login({ email, password });
      onSuccess(res.data);
      // navigate to feed so the user sees posts immediately
      navigate('/');
    }catch(err){
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand"><Link to="/" className="brand">LinkedIn Clone</Link></div>
      <div className="auth-card card">
        <h2>Welcome back</h2>
        <p className="small">Sign in to see updates from your network</p>
        <form onSubmit={submit} style={{marginTop:12}}>
          <div className="form-row"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="form-row"><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
            <button className="btn">Login</button>
            <a href="#" className="small">Forgot password?</a>
          </div>
          {error && <div className="small" style={{color:'red', marginTop:8}}>{error}</div>}
        </form>
        <div className="auth-cta">
          <span className="small">New here?</span> <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  )
}
