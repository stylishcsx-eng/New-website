import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Ban, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Banlist = () => {
  const [bans, setBans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBans();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchBans, 30000);
    return () => clearInterval(interval);
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

  const filteredBans = bans.filter(ban =>
    ban.player_nickname.toLowerCase().includes(search.toLowerCase()) ||
    ban.steamid.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate expiry date based on duration
  const getExpiryDate = (banDate, duration) => {
    if (duration === 'Permanent' || duration.toLowerCase().includes('permanent')) {
      return 'Never';
    }
    
    // Parse duration (e.g., "30 days", "7 days", "60 min")
    const match = duration.match(/(\d+)\s*(min|hour|day|week|month|year)/i);
    if (!match) return duration;
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const banDateTime = new Date(banDate);
    let expiryDate = new Date(banDateTime);
    
    switch (unit) {
      case 'min':
        expiryDate.setMinutes(expiryDate.getMinutes() + amount);
        break;
      case 'hour':
        expiryDate.setHours(expiryDate.getHours() + amount);
        break;
      case 'day':
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + amount);
        break;
      case 'week':
        expiryDate.setDate(expiryDate.getDate() + (amount * 7));
        break;
      case 'month':
        expiryDate.setMonth(expiryDate.getMonth() + amount);
        break;
      case 'year':
        expiryDate.setFullYear(expiryDate.getFullYear() + amount);
        break;
      default:
        return duration;
    }
    
    // Check if already expired
    if (expiryDate < new Date()) {
      return 'Expired';
    }
    
    return format(expiryDate, 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING BANLIST...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Ban className="w-10 h-10 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white" data-testid="page-title">
              BANLIST
            </h1>
          </div>
          <p className="text-muted-foreground">Players banned from ShadowZM : Zombie Reverse</p>
          <p className="text-xs text-muted-foreground mt-1">Auto-refreshes every 30 seconds</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-bans"
            placeholder="Search by nickname or SteamID..."
            className="w-full bg-card/50 border border-white/10 focus:border-primary pl-12 pr-4 py-4 text-white font-mono text-sm outline-none transition-colors"
          />
        </div>

        {/* Bans Table */}
        <div className="bg-card/50 border border-red-900/30 overflow-hidden">
          <div className="p-4 border-b border-red-900/30 bg-red-900/10 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg uppercase tracking-widest text-white">Criminal Records</h2>
            <span className="ml-auto font-mono text-sm text-muted-foreground">{filteredBans.length} bans</span>
          </div>

          {filteredBans.length === 0 ? (
            <div className="text-center py-16">
              <Ban className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-heading uppercase">No bans found</p>
              {search && <p className="text-sm text-muted-foreground/50 mt-2">Try a different search term</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="banlist-table">
                <thead className="bg-muted/50 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Player</th>
                    <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">SteamID</th>
                    <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Banned On</th>
                    <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBans.map((ban) => (
                    <tr key={ban.id} className="hover:bg-red-900/5 transition-colors" data-testid="ban-row">
                      <td className="px-6 py-4 font-heading font-bold text-white">{ban.player_nickname}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{ban.steamid}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{ban.reason}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {format(new Date(ban.ban_date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-heading uppercase ${
                          ban.duration === 'Permanent' || ban.duration.toLowerCase().includes('permanent')
                            ? 'bg-red-900/30 text-red-500 border border-red-500/50' 
                            : getExpiryDate(ban.ban_date, ban.duration) === 'Expired'
                            ? 'bg-green-900/30 text-green-500 border border-green-500/50'
                            : 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/50'
                        }`}>
                          {getExpiryDate(ban.ban_date, ban.duration)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
