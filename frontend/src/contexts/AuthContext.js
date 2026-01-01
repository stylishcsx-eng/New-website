import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      if (response.data.steamid || response.data.nickname) {
        fetchNotifications(response.data.steamid, response.data.nickname);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const fetchNotifications = useCallback(async (steamid, nickname) => {
    try {
      const params = new URLSearchParams();
      if (steamid) params.append('steamid', steamid);
      if (nickname) params.append('nickname', nickname);
      
      const response = await axios.get(`${API}/notifications?${params.toString()}`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, []);

  const markNotificationRead = async (notifId) => {
    try {
      await axios.patch(`${API}/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await axios.delete(`${API}/notifications/${notifId}`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // Register with email, password, steamid
  const register = async (nickname, email, password, steamid) => {
    const response = await axios.post(`${API}/auth/register`, { nickname, email, password, steamid });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // Admin login (keep for admin panel)
  const adminLogin = async (username, password) => {
    const response = await axios.post(`${API}/auth/admin-login`, { username, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  // Handle Discord OAuth callback
  const handleAuthCallback = (callbackToken) => {
    localStorage.setItem('token', callbackToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${callbackToken}`;
    setToken(callbackToken);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isOwner = user?.role === 'owner';

  const refreshNotifications = () => {
    if (user?.steamid || user?.nickname) {
      fetchNotifications(user.steamid, user.nickname);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      adminLogin,
      logout,
      handleAuthCallback,
      isAdmin,
      isOwner,
      isAuthenticated: !!user,
      notifications,
      unreadCount,
      markNotificationRead,
      deleteNotification,
      refreshNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};
