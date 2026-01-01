import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Hash } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ 
    nickname: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    steamid: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      await register(formData.nickname, formData.email, formData.password, formData.steamid);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
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
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-white mb-2">
            REGISTER
          </h1>
          <p className="text-muted-foreground">
            Create your account to join the community
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 mb-6 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="bg-card/50 border-2 border-primary/30 p-8 space-y-5">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Nickname
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="Your nickname"
                required
              />
            </div>
          </div>

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
              Steam ID
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="steamid"
                value={formData.steamid}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="STEAM_0:0:123456789"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Find your Steam ID in-game using 'status' in console
            </p>
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
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
            {loading ? 'CREATING ACCOUNT...' : 'REGISTER'}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};
