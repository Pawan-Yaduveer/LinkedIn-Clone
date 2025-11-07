import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { likePost, deletePost, addComment, deleteComment, editPost } from '../api'
import { renderFormattedText } from '../utils/format'

export default function PostItem({ post, onRefresh, currentUser }){
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const commentInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImageFile, setEditImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Inline SVG icons (inherit currentColor)
  const IconLike = ({ filled=false }) => (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M12.1 21.35l-1.1-.98C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.86C11.46 4.99 12.96 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.9 11.87l-1 .98z"/>
    </svg>
  );
  const IconComment = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
    </svg>
  );
  const IconEdit = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
  const IconTrash = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );

  const userId = currentUser?.id || currentUser?._id;
  const liked = post.likes?.includes(userId) || false;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function toggleLike(){ await likePost(post._id); onRefresh(); }
  async function remove(){ await deletePost(post._id); onRefresh(); }

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

  const [confirmCommentDelete, setConfirmCommentDelete] = useState(null);
  async function removeComment(commentId){
    // Defensive: ensure we have an id
    if (!commentId) return alert('Missing comment id');
    try {
      setConfirmCommentDelete(null);
      const resp = await deleteComment(post._id, commentId);
      // If API returned updated post, patch local post.comments quickly without full refresh
      if (resp?.data?.post?.comments) {
        post.comments = resp.data.post.comments; // mutate local reference (component gets new props on parent refresh)
      }
      onRefresh();
    } catch (e) {
      console.error('Failed to delete comment', e);
      setConfirmCommentDelete(commentId);
      const msg = e?.response?.data?.message || 'Could not delete comment. Please try again.';
      alert(msg);
    }
  }

  async function saveEdit(){
    const textChanged = (editText.trim() !== (post.text || ''));
    const wantsRemoval = removeImage && !!post.image;
    const wantsNewFile = !!editImageFile;

    if (!textChanged && !wantsRemoval && !wantsNewFile) { setEditing(false); return; }

    if (wantsRemoval || wantsNewFile) {
      const fd = new FormData();
      fd.append('text', editText);
      if (wantsRemoval) fd.append('removeImage', 'true');
      if (wantsNewFile) fd.append('image', editImageFile);
      await editPost(post._id, fd);
    } else {
      await editPost(post._id, { text: editText });
    }

    setEditing(false);
    setEditImageFile(null);
    setRemoveImage(false);
    onRefresh();
  }


  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <div>
          <div className="username"><Link to={`/profile/${post.user}`} style={{textDecoration:'none'}}>{post.name}</Link></div>
          <div className="small">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
        {userId && (post.user === userId || post.user === currentUser?._id) && (
          <div style={{position:'relative', display:'flex', gap:6}}>
            <button onClick={()=>setShowDeleteConfirm(v=>!v)} className="btn danger xs icon" aria-label="Delete post" data-tip="Delete">
              <IconTrash />
            </button>
            {showDeleteConfirm && (
              <div className="confirm-pop" onMouseLeave={()=>setShowDeleteConfirm(false)}>
                <h5>Delete this post?</h5>
                <div className="confirm-actions">
                  <button className="btn secondary xs" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="btn danger xs" onClick={remove}>Delete</button>
                </div>
              </div>
            )}
            <button onClick={()=>{ setEditing(true); setEditText(post.text); }} className="btn outline xs icon" aria-label="Edit post" data-tip="Edit">
              <IconEdit />
            </button>
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
            <div style={{marginTop:8, display:'flex', gap:12, alignItems:'center'}}>
              <label className="file-btn">
                Choose image
                <input className="file-input" type="file" accept="image/*" onChange={e=>{ setEditImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setRemoveImage(false); }} />
              </label>
              {post.image && (
                <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  <input type="checkbox" checked={removeImage} onChange={e=>{ setRemoveImage(e.target.checked); if (e.target.checked) setEditImageFile(null); }} />
                  Remove current image
                </label>
              )}
            </div>
            <div style={{marginTop:8}}>
              <button onClick={saveEdit} className="btn">Save</button>
              <button onClick={()=>{ setEditing(false); setEditImageFile(null); setRemoveImage(false); }} className="btn secondary" style={{marginLeft:8}}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>{renderFormattedText(post.text)}</div>
        )}
      </div>

      {post.image && !editing && (
        <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${post.image}`} className="post-image" alt="post" />
      )}

      <div style={{marginTop:8, display:'flex', gap:12, alignItems:'center'}}>
        <button onClick={toggleLike} className={`btn like sm icon ${liked ? 'active' : ''}`} data-tip={liked ? 'Unlike' : 'Like'}>
          <IconLike filled={liked} /> {liked ? 'Liked' : 'Like'} {post.likes?.length ? <span style={{marginLeft:6, fontWeight:600}}>{post.likes.length}</span> : null}
        </button>
        <button onClick={()=>{ setShowCommentInput(s=>!s); }} className="btn outline sm icon" data-tip="Comment">
          <IconComment /> Comment {post.comments?.length ? `(${post.comments.length})` : ''}
        </button>
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
                  <div style={{position:'relative'}}>
                    <button className="btn danger xs" onClick={()=>setConfirmCommentDelete(c._id || c.id)}>Delete</button>
                    {confirmCommentDelete === (c._id || c.id) && (
                      <div className="confirm-pop" onMouseLeave={()=>setConfirmCommentDelete(null)}>
                        <h5>Delete this comment?</h5>
                        <div className="confirm-actions">
                          <button className="btn secondary xs" onClick={()=>setConfirmCommentDelete(null)}>Cancel</button>
                          <button className="btn danger xs" onClick={()=>removeComment(c._id || c.id)}>Delete</button>
                        </div>
                      </div>
                    )}
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
