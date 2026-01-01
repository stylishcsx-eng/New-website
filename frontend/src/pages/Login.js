import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';

// Discord brand color
const DISCORD_COLOR = '#5865F2';

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithDiscord, isAuthenticated } = useAuth();
  const error = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
            {error === 'discord_auth_failed' && 'Discord authentication failed. Please try again.'}
            {error === 'discord_user_failed' && 'Failed to get Discord user info. Please try again.'}
            {error === 'server_error' && 'Server error. Please try again later.'}
            {error === 'no_token' && 'Authentication failed. Please try again.'}
            {!['discord_auth_failed', 'discord_user_failed', 'server_error', 'no_token'].includes(error) && 'An error occurred. Please try again.'}
          </div>
        )}

        {/* Discord Login Button */}
        <button
          onClick={loginWithDiscord}
          className="w-full flex items-center justify-center space-x-3 px-8 py-4 text-white font-heading text-lg uppercase tracking-widest transition-all hover:opacity-90"
          style={{ backgroundColor: DISCORD_COLOR }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span>Login with Discord</span>
        </button>

        <p className="text-center text-muted-foreground text-sm mt-6">
          By logging in, you agree to our terms of service.
        </p>

        {/* Admin Login Link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-muted-foreground text-sm mb-2">Are you an admin?</p>
          <button
            onClick={() => navigate('/admin-login')}
            className="text-primary hover:underline text-sm font-heading uppercase tracking-wider"
          >
            Admin Panel Login
          </button>
        </div>
      </div>
    </div>
  );
};
