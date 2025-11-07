import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Ensure Authorization header is set as early as possible on app load
try {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (saved) axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
} catch {}

export function setTokenHeader(token) {
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete axios.defaults.headers.common['Authorization'];
}

export const register = (data) => axios.post(`${API_URL}/api/auth/register`, data);
export const login = (data) => axios.post(`${API_URL}/api/auth/login`, data);
export const getPosts = () => axios.get(`${API_URL}/api/posts`);
export const createPost = (formData) => axios.post(`${API_URL}/api/posts`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const likePost = (id) => axios.post(`${API_URL}/api/posts/${id}/like`);
export const deletePost = (id) => axios.delete(`${API_URL}/api/posts/${id}`);
export const editPost = (id, data) => {
  const url = `${API_URL}/api/posts/${id}`;
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return axios.put(url, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return axios.put(url, data);
}
export const addComment = (postId, data) => axios.post(`${API_URL}/api/posts/${postId}/comments`, data);
export const deleteComment = (postId, commentId) => axios.delete(`${API_URL}/api/posts/${postId}/comments/${commentId}`);
export const getProfile = (userId) => axios.get(`${API_URL}/api/users/${userId}`);
export const updateProfile = (userId, formData) => axios.put(`${API_URL}/api/users/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getUsers = () => axios.get(`${API_URL}/api/users`);
export const connectUser = (userId) => axios.post(`${API_URL}/api/users/${userId}/connect`);
export const disconnectUser = (userId) => axios.delete(`${API_URL}/api/users/${userId}/connect`);
export const deleteUser = (userId) => axios.delete(`${API_URL}/api/users/${userId}`);
