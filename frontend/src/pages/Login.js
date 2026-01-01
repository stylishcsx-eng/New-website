import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 border border-primary flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-white mb-2">
            LOGIN
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 mb-6 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card/50 border-2 border-primary/30 p-8 space-y-6">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-widest px-8 py-4 transition-all disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register here
          </Link>
        </p>

        {/* Admin Login Link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-muted-foreground text-sm mb-2">Are you an admin?</p>
          <Link
            to="/admin-login"
            className="text-primary hover:underline text-sm font-heading uppercase tracking-wider"
          >
            Admin Panel Login
          </Link>
        </div>
      </div>
    </div>
  );
};
