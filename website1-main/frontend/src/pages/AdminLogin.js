import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminLogin(formData.username, formData.password);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        {/* Warning Banner */}
        <div className="bg-red-900/20 border border-red-500/50 p-4 mb-6 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-500 font-heading text-sm uppercase tracking-wider">Restricted Area</p>
            <p className="text-muted-foreground text-xs">Authorized personnel only</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white mb-2" data-testid="page-title">
            ADMIN ACCESS
          </h1>
          <p className="text-muted-foreground text-sm">ShadowZM : Zombie Reverse Control Panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card/50 border-2 border-primary/30 p-8 space-y-6">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                data-testid="input-admin-username"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="Admin username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                data-testid="input-admin-password"
                className="w-full bg-muted/50 border border-white/10 focus:border-primary pl-12 pr-12 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="••••••••"
                required
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

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-admin-login"
            className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-widest px-8 py-4 transition-all disabled:opacity-50 glow-red"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS ADMIN PANEL'}
          </button>
        </form>

        {/* Security Note */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          All login attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
};
