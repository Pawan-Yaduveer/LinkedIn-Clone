import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { likePost, deletePost, addComment, deleteComment, editPost } from '../api'

export default function PostItem({ post, onRefresh, currentUser }){
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const commentInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);

  const userId = currentUser?.id || currentUser?._id;
  const liked = post.likes?.includes(userId) || false;

  async function toggleLike(){ await likePost(post._id); onRefresh(); }
  async function remove(){ if(window.confirm('Delete this post?')){ await deletePost(post._id); onRefresh(); } }

  async function submitComment(e){
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(post._id, { text: commentText });
    setCommentText('');
    onRefresh();
  }

  useEffect(()=>{
    if(showCommentInput && commentInputRef.current){
      commentInputRef.current.focus();
    }
  }, [showCommentInput]);

  async function removeComment(commentId){
    if (!window.confirm('Delete this comment?')) return;
    await deleteComment(post._id, commentId);
    onRefresh();
  }

  async function saveEdit(){
    if (editText.trim() === post.text) { setEditing(false); return; }
    await editPost(post._id, { text: editText });
    setEditing(false);
    onRefresh();
  }

  // render post/comment text with paragraphs and hashtag highlighting
  function renderFormattedText(text){
    if (!text) return null;
    // split into paragraphs by one or more newlines
    const paragraphs = text.split(/\n+/);
    return paragraphs.map((p, idx) => {
      // split by hashtags (keep the #token)
      const parts = p.split(/(#\w[\w-]*)/g);
      return (
        <p key={idx} style={{margin: '6px 0'}}>
          {parts.map((part, i) => {
            if (!part) return null;
            if (part.startsWith('#')){
              // render hashtag as styled span (could be a Link)
              const tag = part.slice(1);
              return <span key={i} className="hashtag">#{tag}</span>
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      )
    })
  }

  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <div>
          <div className="username"><Link to={`/profile/${post.user}`} style={{textDecoration:'none'}}>{post.name}</Link></div>
          <div className="small">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
        {userId && (post.user === userId || post.user === currentUser?._id) && (
          <div>
            <button onClick={remove} style={{marginLeft:8}}>Delete</button>
            <button onClick={()=>{ setEditing(true); setEditText(post.text); }} style={{marginLeft:8}}>Edit</button>
          </div>
        )}
      </div>

      <div style={{marginTop:8}}>
        {editing ? (
          <div>
            <textarea
              ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              rows={3}
              value={editText}
              onChange={e=>{ setEditText(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
              style={{width:'100%'}}
            />
            <div style={{marginTop:8}}>
              <button onClick={saveEdit} className="btn">Save</button>
              <button onClick={()=>setEditing(false)} style={{marginLeft:8}}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>{renderFormattedText(post.text)}</div>
        )}
      </div>

      {post.image && <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${post.image}`} className="post-image" alt="post" />}

      <div style={{marginTop:8, display:'flex', gap:12, alignItems:'center'}}>
        <button onClick={toggleLike} className="btn" style={{background: liked ? '#0a66c2' : '#eef3f8', color: liked ? '#fff' : '#0a66c2', padding:'6px 10px', borderRadius:6}}>
          {liked ? 'Liked' : 'Like'} {post.likes?.length ? <span style={{marginLeft:6, fontWeight:600}}>{post.likes.length}</span> : null}
        </button>
        <button onClick={()=>{ setShowCommentInput(s=>!s); }} style={{background:'transparent', border:'none', color:'#0a66c2'}}>Comment {post.comments?.length ? `(${post.comments.length})` : ''}</button>
      </div>

      <div style={{marginTop:12}}>
        <strong className="small">Comments</strong>
        <div style={{marginTop:8}}>
          {post.comments?.length ? post.comments.map(c => (
            <div key={c._id || c.id} style={{borderTop:'1px solid #f0f0f0', paddingTop:8, paddingBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:600}}>{c.name}</div>
                  <div className="small">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                {(userId && (c.user === userId || post.user === userId)) && (
                  <div>
                    <button onClick={()=>removeComment(c._id || c.id)}>Delete</button>
                  </div>
                )}
              </div>
              <div style={{marginTop:6}}>{renderFormattedText(c.text)}</div>
            </div>
          )) : <div className="small">No comments yet</div>}
        </div>

        {currentUser && showCommentInput && (
          <form onSubmit={submitComment} style={{marginTop:8}}>
            <input ref={commentInputRef} placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
            <div style={{marginTop:6}}><button className="btn">Comment</button></div>
          </form>
        )}
      </div>
    </div>
  )
}
