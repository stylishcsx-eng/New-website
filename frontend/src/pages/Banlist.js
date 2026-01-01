import { useEffect, useState } from 'react';
import axios from 'axios';
import { Ban, Search, ChevronDown, ChevronUp, Clock, User, Shield, Hash, Globe, Calendar, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Convert SteamID to Steam Community ID (Steam64)
const steamIdToSteam64 = (steamId) => {
  if (!steamId || !steamId.startsWith('STEAM_')) return null;
  try {
    const parts = steamId.split(':');
    if (parts.length !== 3) return null;
    const Y = parseInt(parts[1]);
    const Z = parseInt(parts[2]);
    // Steam64 = 76561197960265728 + (Z * 2) + Y
    const steam64 = BigInt('76561197960265728') + BigInt(Z * 2) + BigInt(Y);
    return steam64.toString();
  } catch {
    return null;
  }
};

// Check if ban is expired
const isBanExpired = (ban) => {
  if (!ban.duration || ban.duration.toLowerCase().includes('permanent')) {
    return false;
  }
  // Parse duration and check against ban_date
  // For now, assume bans with "expires_at" field or duration containing time
  if (ban.expires_at) {
    return new Date(ban.expires_at) < new Date();
  }
  return ban.is_expired || false;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const Banlist = () => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBan, setExpandedBan] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, expired

  useEffect(() => {
    fetchBans();
  }, []);

  const fetchBans = async () => {
    try {
      const response = await axios.get(`${API}/bans`);
      setBans(response.data);
    } catch (error) {
      console.error('Failed to fetch bans', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBans = bans.filter(ban => {
    // Search filter
    const matchesSearch = !searchTerm || 
      ban.player_nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ban.steamid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ban.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ban.admin_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const expired = isBanExpired(ban);
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && !expired) ||
      (filter === 'expired' && expired);
    
    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (banId) => {
    setExpandedBan(expandedBan === banId ? null : banId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING BANS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 mb-8">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500 flex items-center justify-center">
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2">
                BAN LIST
              </h1>
              <p className="text-muted-foreground">
                {bans.length} total bans • {bans.filter(b => !isBanExpired(b)).length} active
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SteamID, reason, or admin..."
              className="w-full bg-card/50 border border-white/10 pl-12 pr-4 py-3 text-white outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wider transition-colors ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-card/50 text-muted-foreground hover:text-white'
              }`}
            >
              All ({bans.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wider transition-colors ${
                filter === 'active' ? 'bg-red-500 text-white' : 'bg-card/50 text-muted-foreground hover:text-white'
              }`}
            >
              Active ({bans.filter(b => !isBanExpired(b)).length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wider transition-colors ${
                filter === 'expired' ? 'bg-green-500 text-white' : 'bg-card/50 text-muted-foreground hover:text-white'
              }`}
            >
              Expired ({bans.filter(b => isBanExpired(b)).length})
            </button>
          </div>
        </div>

        {/* Bans List */}
        {filteredBans.length === 0 ? (
          <div className="text-center py-16 bg-card/30 border border-white/10">
            <Ban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No bans found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-3 bg-card/80 border border-white/10 text-xs text-muted-foreground uppercase tracking-wider font-heading">
              <div>Date</div>
              <div>Player</div>
              <div>Admin</div>
              <div className="col-span-2">Reason</div>
              <div>Duration</div>
              <div>Status</div>
            </div>

            {/* Ban Rows */}
            {filteredBans.map((ban) => {
              const expired = isBanExpired(ban);
              const steam64 = steamIdToSteam64(ban.steamid);
              const isExpanded = expandedBan === ban.id;

              return (
                <div key={ban.id} className={`border ${expired ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  {/* Main Row */}
                  <div 
                    onClick={() => toggleExpand(ban.id)}
                    className="grid grid-cols-2 md:grid-cols-7 gap-4 px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="text-sm text-muted-foreground">
                      {new Date(ban.ban_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Ban className={`w-4 h-4 ${expired ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-white font-medium truncate">{ban.player_nickname}</span>
                    </div>
                    <div className="hidden md:block text-yellow-500 truncate">{ban.admin_name}</div>
                    <div className="hidden md:block col-span-2 text-muted-foreground truncate">{ban.reason}</div>
                    <div className={`hidden md:block ${ban.duration?.toLowerCase().includes('permanent') ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                      {ban.duration || 'Permanent'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-heading uppercase ${
                        expired ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className={`border-t ${expired ? 'border-green-500/20' : 'border-red-500/20'} bg-black/30`}>
                      <div className="p-4">
                        <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                          <AlertTriangle className={`w-5 h-5 ${expired ? 'text-green-500' : 'text-red-500'}`} />
                          <span>Ban Details</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <User className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Nickname</p>
                                <p className="text-white font-medium">{ban.player_nickname}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Hash className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">SteamID</p>
                                <p className="text-white font-mono text-sm">{ban.steamid}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Hash className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Steam Community ID</p>
                                <p className="text-white font-mono text-sm">{steam64 || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">IP Address</p>
                                <p className="text-yellow-500 italic">{ban.ip || 'hidden'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Ban Type</p>
                                <p className="text-white">SteamID</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10">
                              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Reason</p>
                                <p className="text-white">{ban.reason || 'No reason provided'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Invoked On</p>
                                <p className="text-white">{formatDate(ban.ban_date)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Expires On</p>
                                <p className={`${ban.duration?.toLowerCase().includes('permanent') ? 'text-red-500 font-bold' : expired ? 'text-green-500' : 'text-white'}`}>
                                  {ban.duration?.toLowerCase().includes('permanent') ? 'Not applicable' : 
                                   ban.expires_at ? formatDate(ban.expires_at) : ban.duration}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Banned By</p>
                                <p className="text-yellow-500 font-medium">{ban.admin_name || 'System'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10">
                              <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Banned On</p>
                                <p className="text-white">{ban.source === 'server' ? 'Server' : 'Website'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Steam Profile Link */}
                        {steam64 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <a
                              href={`https://steamcommunity.com/profiles/${steam64}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1b2838] text-white hover:bg-[#2a475e] transition-colors"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385l3.315-4.685c-1.83-.39-3.195-2.01-3.195-3.975 0-2.205 1.785-4.005 3.99-4.005.315 0 .63.045.93.12l2.79-2.01C15.135 5.895 12.705 4.5 12 4.5c-4.14 0-7.5 3.36-7.5 7.5 0 3.315 2.145 6.135 5.13 7.125l4.125-2.955c.99.57 2.145.9 3.375.9 3.72 0 6.75-3.03 6.75-6.75 0-3.495-2.67-6.375-6.075-6.705L12 0z"/>
                              </svg>
                              <span className="font-heading text-sm uppercase tracking-wider">View Steam Profile</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
