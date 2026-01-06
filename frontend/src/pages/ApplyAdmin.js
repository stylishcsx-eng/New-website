import { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle, Shield, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ApplyAdmin = () => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    nickname: '',
    steamid: '',
    age: '',
    experience: '',
    reason: '',
    admin_commands_knowledge: 'good'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/admin-applications`, {
        ...formData,
        age: parseInt(formData.age)
      });
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Show message if user is already an admin
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-primary/20 border border-primary flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold uppercase text-white mb-4">
            YOU'RE ALREADY AN ADMIN
          </h1>
          <p className="text-muted-foreground mb-4">
            You already have {user?.role === 'owner' ? 'Owner' : 'Admin'} privileges on ShadowZM : Zombie Reverse.
          </p>
          <p className="text-sm text-muted-foreground">
            This page is for players who want to apply for admin status.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-secondary/20 border border-secondary flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-secondary" />
          </div>
          <h1 className="font-heading text-4xl font-bold uppercase text-white mb-4" data-testid="success-title">
            APPLICATION SUBMITTED
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for applying to become an admin on ShadowZM : Zombie Reverse! 
            Your application will be reviewed by our admin team. You will be notified about the status.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            data-testid="btn-submit-another"
            className="px-6 py-3 bg-primary text-white font-heading uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white" data-testid="page-title">
              APPLY FOR ADMIN
            </h1>
          </div>
          <p className="text-muted-foreground">Join our admin team and help maintain fair gameplay on ShadowZM : Zombie Reverse</p>
        </div>

        {/* Requirements */}
        <div className="bg-card/50 border border-white/10 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-heading text-sm uppercase tracking-widest text-white">Requirements</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Must be at least 16 years old</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Active player on the server for at least 2 weeks</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Good knowledge of server rules</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>No previous bans on the server</span>
            </li>
          </ul>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-card/50 border border-white/10 p-8 space-y-6">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              In-Game Nickname *
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              data-testid="input-nickname"
              className="w-full bg-muted/50 border border-white/10 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="Your in-game nickname"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              SteamID *
            </label>
            <input
              type="text"
              name="steamid"
              value={formData.steamid}
              onChange={handleChange}
              data-testid="input-steamid"
              className="w-full bg-muted/50 border border-white/10 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="STEAM_0:0:123456"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Age *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              data-testid="input-age"
              className="w-full bg-muted/50 border border-white/10 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="18"
              min="16"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              CS 1.6 Experience *
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              data-testid="textarea-experience"
              className="w-full bg-muted/50 border border-white/10 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors h-24 resize-none"
              placeholder="Describe your CS 1.6 experience and any previous admin experience..."
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2 font-heading">
              Why do you want to be admin? *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              data-testid="textarea-reason"
              className="w-full bg-muted/50 border border-white/10 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors h-32 resize-none"
              placeholder="Explain why you want to become an admin on our server..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-submit-application"
            className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-widest px-8 py-4 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}</span>
          </button>

          <p className="text-xs text-muted-foreground text-center">
            * All fields are required. Applications are reviewed by the admin team.
          </p>
        </form>
      </div>
    </div>
  );
};
