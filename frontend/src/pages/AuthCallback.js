import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('Error: ' + error);
      setTimeout(() => {
        navigate('/login?error=' + error);
      }, 1000);
      return;
    }

    if (token) {
      setStatus('Login successful! Redirecting...');
      handleAuthCallback(token);
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } else {
      setStatus('No token received');
      setTimeout(() => {
        navigate('/login?error=no_token');
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-primary font-heading text-2xl uppercase tracking-widest">{status}</div>
      </div>
    </div>
  );
};
