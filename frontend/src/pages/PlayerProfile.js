import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Shield, Crown, Calendar, MessageSquare, Edit, Save, X,
  Star, Award, Target, Skull, ChevronRight, Clock, Hash, Eye,
  Users, AlertTriangle, Activity, UserPlus, UserMinus, Camera,
  Globe, Cake, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format relative time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
};

// Get role badge styles
const getRoleBadge = (role) => {
  switch(role?.toLowerCase()) {
    case 'owner':
      return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50', icon: Crown, color: '#ef4444' };
    case 'admin':
      return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/50', icon: Shield, color: '#22c55e' };
    case 'moderator':
      return { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50', icon: Shield, color: '#3b82f6' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-white/10', icon: User, color: '#666' };
  }
};

export const PlayerProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', steamid: '', birthday: '', location: '', avatar_url: '' });
  const [activeTab, setActiveTab] = useState('activity');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchData();
    // Record visit
    if (isAuthenticated && !isOwnProfile) {
      recordVisit();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      const [profileRes, postsRes, visitorsRes] = await Promise.all([
        axios.get(`${API}/users/${userId}/profile`),
        axios.get(`${API}/users/${userId}/posts?limit=20`),
        axios.get(`${API}/users/${userId}/visitors?limit=5`).catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);
      setVisitors(visitorsRes.data);
      setEditData({
        bio: profileRes.data.bio || '',
        steamid: profileRes.data.steamid || '',
        birthday: profileRes.data.birthday || '',
        location: profileRes.data.location || '',
        avatar_url: profileRes.data.avatar_url || ''
      });

      // Try to fetch player stats if steamid exists
      if (profileRes.data.steamid) {
        try {
          const statsRes = await axios.get(`${API}/players/${profileRes.data.steamid}`);
          setPlayerStats(statsRes.data);
        } catch (e) {
          // Player stats not found
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const recordVisit = async () => {
    try {
      await axios.post(`${API}/users/${userId}/visit`);
    } catch (e) {}
  };

  const handleSaveProfile = async () => {
    try {
      await axios.patch(`${API}/users/profile`, editData);
      toast.success('Profile updated!');
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await axios.post(`${API}/users/${userId}/follow`);
      toast.success(profile.is_following ? 'Unfollowed' : 'Following!');
      fetchData();
    } catch (error) {
      toast.error('Failed to follow');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING PROFILE...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-heading text-xl">User not found</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const roleBadge = getRoleBadge(profile.role);
  const RoleIcon = roleBadge.icon;

  return (
    <div className="min-h-screen bg-background pt-16 pb-16">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: profile.role === 'owner' 
              ? 'linear-gradient(135deg, #7f1d1d 0%, #1a1a1a 100%)'
              : profile.role === 'admin'
              ? 'linear-gradient(135deg, #14532d 0%, #1a1a1a 100%)'
              : profile.role === 'moderator'
              ? 'linear-gradient(135deg, #1e3a5f 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
        
        {/* Online Status Indicator */}
        {profile.is_online && (
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-500 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 z-20">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 bg-card shadow-xl"
                style={{ borderColor: roleBadge.color }}
              >
                {profile.discord_avatar ? (
                  <img 
                    src={profile.discord_avatar} 
                    alt={profile.nickname} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${roleBadge.bg}`}>
                    <span className={`text-5xl font-bold ${roleBadge.text}`}>
                      {profile.nickname?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Role Badge Overlay */}
              <div 
                className="absolute -bottom-2 -right-2 p-2 rounded-full border-2 bg-background"
                style={{ borderColor: roleBadge.color }}
              >
                <RoleIcon className="w-5 h-5" style={{ color: roleBadge.color }} />
              </div>
              
              {/* Online indicator */}
              {profile.is_online && (
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 pb-4">
              <div className="flex items-center space-x-3 mb-2 flex-wrap">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                  {profile.nickname}
                </h1>
                <span 
                  className="px-3 py-1 text-sm font-heading uppercase tracking-wider border"
                  style={{ 
                    backgroundColor: `${roleBadge.color}20`,
                    borderColor: `${roleBadge.color}50`,
                    color: roleBadge.color
                  }}
                >
                  {profile.role || 'Player'}
                </span>
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground max-w-xl mb-4">{profile.bio}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-white transition-all font-heading uppercase text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center space-x-2 px-4 py-2 border font-heading uppercase text-sm transition-all ${
                        profile.is_following 
                          ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-red-500/20 hover:border-red-500 hover:text-red-500'
                          : 'bg-primary/20 border-primary text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {profile.is_following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{profile.is_following ? 'Unfollow' : 'Follow'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex space-x-4 pb-4">
              <div className="text-center px-4 py-2 bg-card/50 border border-white/10">
                <p className="text-2xl font-bold text-primary">{profile.post_count || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Posts</p>
              </div>
              <div className="text-center px-4 py-2 bg-card/50 border border-white/10">
                <p className="text-2xl font-bold text-primary">{profile.followers_count || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Followers</p>
              </div>
              <div className="text-center px-4 py-2 bg-card/50 border border-white/10">
                <p className="text-2xl font-bold text-primary">{profile.reputation || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Rep</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <Edit className="w-6 h-6 text-primary" />
                <span>Edit Profile</span>
              </h2>
              <div className="space-y-4">
                {/* Avatar Preview & URL */}
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-primary/50">
                      {editData.avatar_url || profile.discord_avatar ? (
                        <img 
                          src={editData.avatar_url || profile.discord_avatar} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <span className="text-primary text-2xl font-bold">{profile.nickname?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Enter an image URL for your profile picture</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={editData.avatar_url}
                    onChange={(e) => setEditData({...editData, avatar_url: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary text-sm"
                    placeholder="https://example.com/your-image.png"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Bio</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary h-24"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">SteamID</label>
                  <input
                    type="text"
                    value={editData.steamid}
                    onChange={(e) => setEditData({...editData, steamid: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary font-mono text-sm"
                    placeholder="STEAM_0:1:123456"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Birthday</label>
                  <input
                    type="date"
                    value={editData.birthday}
                    onChange={(e) => setEditData({...editData, birthday: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Location</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                    placeholder="City, Country"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 font-heading uppercase flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* About Card */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>About</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-white ml-auto">{formatDate(profile.created_at)}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Visited</span>
                  <span className="text-white ml-auto">{formatRelativeTime(profile.last_seen)}</span>
                </div>
                {profile.birthday && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Cake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Birthday</span>
                    <span className="text-white ml-auto">{formatDate(profile.birthday)}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-white ml-auto">{profile.location}</span>
                  </div>
                )}
                {profile.steamid && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">SteamID</span>
                    <span className="text-white font-mono text-xs ml-auto">{profile.steamid}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Points */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Warning Points</span>
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Points</span>
                <span className={`text-2xl font-bold ${(profile.warning_points || 0) > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {profile.warning_points || 0}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                  style={{ width: `${Math.min((profile.warning_points || 0) * 10, 100)}%` }}
                />
              </div>
            </div>

            {/* Recent Visitors */}
            {visitors.length > 0 && (
              <div className="bg-card/50 border border-white/10 p-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Recent Visitors</span>
                </h3>
                <div className="flex -space-x-2">
                  {visitors.map((visitor) => (
                    <Link
                      key={visitor.id}
                      to={`/profile/${visitor.id}`}
                      className="relative group"
                      title={visitor.nickname}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted border-2 border-background overflow-hidden">
                        {visitor.avatar ? (
                          <img src={visitor.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/20">
                            <span className="text-primary text-sm font-bold">{visitor.nickname?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Game Stats */}
            {playerStats && (
              <div className="bg-card/50 border border-white/10 p-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Game Stats</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kills</span>
                    <span className="text-green-500 font-bold">{playerStats.kills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deaths</span>
                    <span className="text-red-500 font-bold">{playerStats.deaths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">K/D Ratio</span>
                    <span className="text-primary font-bold">{playerStats.kd_ratio?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="text-yellow-500 font-bold">#{playerStats.rank || '?'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-card/30 border border-white/10 p-1">
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-4 py-3 font-heading uppercase text-sm transition-all ${
                  activeTab === 'activity'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Activity
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-4 py-3 font-heading uppercase text-sm transition-all ${
                  activeTab === 'posts'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Posts ({profile.post_count || 0})
              </button>
            </div>

            {/* Activity Feed */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-16 bg-card/30 border border-white/10">
                    <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No activity yet</p>
                  </div>
                ) : (
                  posts.slice(0, 10).map((post) => (
                    <div key={post.id} className="bg-card/50 border border-white/10 p-4 hover:border-primary/30 transition-all">
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2"
                          style={{ borderColor: roleBadge.color }}
                        >
                          {profile.discord_avatar ? (
                            <img src={profile.discord_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold">{profile.nickname?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-heading text-white">{profile.nickname}</span>
                            <span className="text-muted-foreground text-sm">
                              {post.type === 'topic' ? 'created a topic' : 'replied to a topic'}
                            </span>
                          </div>
                          <Link
                            to={post.type === 'topic' ? `/forum/topic/${post.id}` : `/forum/topic/${post.topic_id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {post.type === 'topic' ? post.title : `Re: ${post.topic_title || 'Topic'}`}
                          </Link>
                          {post.type === 'reply' && post.content && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {post.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatRelativeTime(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-16 bg-card/30 border border-white/10">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No posts yet</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link
                      key={post.id}
                      to={post.type === 'topic' ? `/forum/topic/${post.id}` : `/forum/topic/${post.topic_id}`}
                      className="block bg-card/50 border border-white/10 p-4 hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs uppercase ${
                              post.type === 'topic' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {post.type === 'topic' ? 'Topic' : 'Reply'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                          {post.type === 'topic' ? (
                            <h4 className="text-white group-hover:text-primary font-heading">
                              {post.title}
                            </h4>
                          ) : (
                            <p className="text-muted-foreground line-clamp-2">
                              {post.content}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-4" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
