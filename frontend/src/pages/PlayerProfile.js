import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Shield, Crown, Calendar, MessageSquare, Edit, Save, X,
  Star, Award, Target, Skull, ChevronRight, Clock, Hash
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

// Get role badge styles
const getRoleBadge = (role) => {
  switch(role?.toLowerCase()) {
    case 'owner':
      return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50', icon: Crown };
    case 'admin':
      return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/50', icon: Shield };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-white/10', icon: User };
  }
};

export const PlayerProfile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', steamid: '' });
  const [activeTab, setActiveTab] = useState('overview');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${userId}/profile`),
        axios.get(`${API}/users/${userId}/posts?limit=10`)
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);
      setEditData({
        bio: profileRes.data.bio || '',
        steamid: profileRes.data.steamid || ''
      });

      // Try to fetch player stats if steamid exists
      if (profileRes.data.steamid) {
        try {
          const statsRes = await axios.get(`${API}/players/${profileRes.data.steamid}`);
          setPlayerStats(statsRes.data);
        } catch (e) {
          // Player stats not found, that's ok
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Profile Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0 opacity-30"
          style={{
            background: profile.role === 'owner' 
              ? 'linear-gradient(135deg, #7f1d1d 0%, #1a1a1a 100%)'
              : profile.role === 'admin'
              ? 'linear-gradient(135deg, #14532d 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #1e3a5f 0%, #1a1a1a 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 ${roleBadge.border} bg-card`}>
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
              <div className={`absolute -bottom-2 -right-2 p-2 rounded-full ${roleBadge.bg} border ${roleBadge.border}`}>
                <RoleIcon className={`w-5 h-5 ${roleBadge.text}`} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                  {profile.nickname}
                </h1>
                <span className={`px-3 py-1 text-sm font-heading uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text} border ${roleBadge.border}`}>
                  {profile.role || 'Player'}
                </span>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{profile.post_count || 0} posts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>{profile.reputation || 0} reputation</span>
                </div>
                {profile.steamid && (
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-xs">{profile.steamid}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {!isEditing && profile.bio && (
                <p className="text-muted-foreground mt-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-white transition-all font-heading uppercase text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 p-6 bg-card/50 border border-white/10">
              <h3 className="font-heading text-lg uppercase text-white mb-4">Edit Profile</h3>
              <div className="space-y-4">
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
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary text-white font-heading uppercase text-sm hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-6 py-3 border border-white/20 text-white font-heading uppercase text-sm hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'posts'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            Posts ({profile.post_count || 0})
          </button>
          {playerStats && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
                activeTab === 'stats'
                  ? 'text-primary border-primary bg-primary/10'
                  : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              Game Stats
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Player Stats Card */}
              {playerStats && (
                <div className="bg-card/50 border border-white/10 p-6">
                  <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Game Statistics</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/30 p-4 text-center">
                      <p className="text-3xl font-bold text-green-500">{playerStats.kills}</p>
                      <p className="text-xs text-muted-foreground uppercase">Kills</p>
                    </div>
                    <div className="bg-muted/30 p-4 text-center">
                      <p className="text-3xl font-bold text-red-500">{playerStats.deaths}</p>
                      <p className="text-xs text-muted-foreground uppercase">Deaths</p>
                    </div>
                    <div className="bg-muted/30 p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-500">{playerStats.headshots}</p>
                      <p className="text-xs text-muted-foreground uppercase">Headshots</p>
                    </div>
                    <div className="bg-muted/30 p-4 text-center">
                      <p className="text-3xl font-bold text-primary">{playerStats.kd_ratio?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground uppercase">K/D Ratio</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Posts Preview */}
              {posts.length > 0 && (
                <div className="bg-card/50 border border-white/10 p-6">
                  <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Recent Activity</span>
                  </h3>
                  <div className="space-y-3">
                    {posts.slice(0, 3).map((post) => (
                      <Link
                        key={post.id}
                        to={post.type === 'topic' ? `/forum/topic/${post.id}` : `/forum/topic/${post.topic_id}`}
                        className="block bg-muted/30 border border-white/5 p-3 hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white group-hover:text-primary truncate">
                              {post.type === 'topic' ? post.title : `Re: ${post.content?.substring(0, 50)}...`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {post.type === 'topic' ? 'Created topic' : 'Replied'} • {formatDate(post.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  {posts.length > 3 && (
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="mt-4 text-primary hover:underline text-sm font-heading uppercase"
                    >
                      View All Posts →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Profile Info */}
            <div className="space-y-6">
              {/* Account Info */}
              <div className="bg-card/50 border border-white/10 p-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Account Info</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Username</p>
                    <p className="text-white font-heading">{profile.nickname}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Role</p>
                    <p className={`font-heading ${roleBadge.text}`}>{profile.role || 'Player'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Member Since</p>
                    <p className="text-white">{formatDate(profile.created_at)}</p>
                  </div>
                  {profile.steamid && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">SteamID</p>
                      <p className="text-white font-mono text-sm">{profile.steamid}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Summary */}
              <div className="bg-card/50 border border-white/10 p-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Activity</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Forum Posts</span>
                    <span className="text-white font-bold">{profile.post_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="text-white font-bold">{profile.reputation || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          {formatDate(post.created_at)}
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

        {activeTab === 'stats' && playerStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Stats */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4">Combat Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">Total Kills</span>
                  <span className="text-2xl font-bold text-green-500">{playerStats.kills}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">Total Deaths</span>
                  <span className="text-2xl font-bold text-red-500">{playerStats.deaths}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">Headshots</span>
                  <span className="text-2xl font-bold text-yellow-500">{playerStats.headshots}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">K/D Ratio</span>
                  <span className="text-2xl font-bold text-primary">{playerStats.kd_ratio?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Ranking Info */}
            <div className="bg-card/50 border border-white/10 p-6">
              <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4">Ranking</h3>
              <div className="text-center py-8">
                <p className="text-6xl font-bold text-primary mb-2">#{playerStats.rank || '?'}</p>
                <p className="text-muted-foreground uppercase text-sm">Server Rank</p>
              </div>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">Level</span>
                  <span className="text-xl font-bold text-white">{playerStats.level || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span className="text-sm text-white">{formatDate(playerStats.last_seen)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
