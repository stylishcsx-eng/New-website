import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

export const Register = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    steamid: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData.nickname, formData.email, formData.password, formData.steamid || null);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20 pb-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary/20 border border-secondary flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white mb-2" data-testid="page-title">
            REGISTER
          </h1>
          <p className="text-muted-foreground text-sm">Create your ShadowZM account</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="bg-card/50 border border-white/10 p-8 space-y-5">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Nickname *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                data-testid="input-nickname"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="Your nickname"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                data-testid="input-email"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              SteamID (Optional)
            </label>
            <div className="relative">
              <Gamepad2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="steamid"
                value={formData.steamid}
                onChange={handleChange}
                data-testid="input-steamid"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="STEAM_0:0:123456"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                data-testid="input-password"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-12 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                data-testid="input-confirm-password"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-register"
            className="w-full bg-secondary hover:bg-secondary/90 text-black font-heading uppercase tracking-widest px-8 py-4 transition-all disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>

          <p className="text-muted-foreground text-sm text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline" data-testid="link-login">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
