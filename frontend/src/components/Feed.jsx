import React, { useEffect, useState, useRef } from 'react'
import { getPosts, createPost } from '../api'
import PostItem from './PostItem'

export default function Feed({ currentUser }){
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

  async function load(){
    const res = await getPosts();
    setPosts(res.data);
  }

  useEffect(()=>{ load(); }, []);

  async function submit(e){
    e.preventDefault();
    const fd = new FormData();
    fd.append('text', text);
    if (image) fd.append('image', image);
    await createPost(fd);
    setText(''); setImage(null);
    load();
  }

  return (
    <div>
      <div className="card">
        <h3>Create a post</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <textarea
              ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              rows={3}
              placeholder={`What's on your mind, ${currentUser.name}?`}
              value={text}
              onChange={e=>{ setText(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
              onFocus={e=>{ const el = e.target; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
            />
          </div>
          <div className="form-row"><input type="file" onChange={e=>setImage(e.target.files[0])} /></div>
          <div className="form-row"><button className="btn">Post</button></div>
        </form>
      </div>

      <h3 style={{marginTop:12}}>Feed</h3>
      {posts.map(p => <PostItem key={p._id} post={p} onRefresh={load} currentUser={currentUser} />)}
    </div>
  )
}
