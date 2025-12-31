import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Server, Users, Ban, Shield, Crosshair, Activity, ChevronRight, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Home = () => {
  const [stats, setStats] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, serverRes, playersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/server-status`),
        axios.get(`${API}/rankings/top?limit=5`)
      ]);
      setStats(statsRes.data);
      setServerStatus(serverRes.data);
      setTopPlayers(playersRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1643245264500-e0dfd5078647?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          {/* Logo */}
          <div className="flex justify-center mb-8 md:mb-12">
            <img 
              src="/shadowzm-logo.png" 
              alt="ShadowZM Logo" 
              className="w-32 h-32 md:w-48 md:h-48 object-contain animate-float drop-shadow-[0_0_30px_rgba(255,75,75,0.6)]"
              data-testid="hero-logo"
            />
          </div>

          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className={`w-3 h-3 rounded-full ${serverStatus?.online ? 'bg-green-500 pulse-online' : 'bg-red-500'}`} />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              {serverStatus?.online ? 'SERVER ONLINE' : 'SERVER OFFLINE'}
            </span>
          </div>
          
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white mb-4 text-center" data-testid="hero-title">
            SHADOWZM
          </h1>
          <p className="text-xl md:text-2xl text-primary font-heading uppercase tracking-wider mb-6 text-center">
            ZOMBIE REVERSE
          </p>
          <p className="text-lg text-muted-foreground font-mono mb-8 max-w-2xl text-center mx-auto">
            {serverStatus?.server_ip || '82.22.174.126:27016'}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/server-status"
              data-testid="btn-view-server"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white font-heading uppercase tracking-widest hover:bg-primary/90 transition-colors"
            >
              <Server className="w-5 h-5" />
              <span>VIEW SERVER</span>
            </Link>
            <a
              href={`steam://connect/${serverStatus?.server_ip || '82.22.174.126:27016'}`}
              data-testid="btn-connect"
              className="inline-flex items-center space-x-2 px-6 py-3 border border-white/20 text-white font-heading uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span>CONNECT NOW</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 p-6 group hover:border-primary/50 transition-colors" data-testid="stat-players-online">
            <Activity className="w-8 h-8 text-primary mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ONLINE NOW</p>
            <p className="text-3xl font-bold font-heading text-white">
              {serverStatus?.players_online || 0}
              <span className="text-muted-foreground text-lg">/{serverStatus?.max_players || 32}</span>
            </p>
          </div>
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 p-6 group hover:border-primary/50 transition-colors" data-testid="stat-total-players">
            <Users className="w-8 h-8 text-primary mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TOTAL PLAYERS</p>
            <p className="text-3xl font-bold font-heading text-white">{stats?.total_players || 0}</p>
          </div>
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 p-6 group hover:border-primary/50 transition-colors" data-testid="stat-total-bans">
            <Ban className="w-8 h-8 text-primary mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TOTAL BANS</p>
            <p className="text-3xl font-bold font-heading text-white">{stats?.total_bans || 0}</p>
          </div>
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 p-6 group hover:border-primary/50 transition-colors" data-testid="stat-current-map">
            <Server className="w-8 h-8 text-primary mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CURRENT MAP</p>
            <p className="text-xl font-bold font-mono text-primary truncate">{serverStatus?.current_map || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Top Players */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">TOP PLAYERS</h2>
            <p className="text-muted-foreground mt-1">Elite warriors of the server</p>
          </div>
          <Link
            to="/rankings"
            data-testid="link-view-all-rankings"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 font-heading uppercase text-sm tracking-widest transition-colors"
          >
            <span>VIEW ALL</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {topPlayers.map((player, index) => (
            <div
              key={player.id}
              data-testid={`top-player-${index + 1}`}
              className={`flex items-center justify-between p-4 bg-card/50 border transition-all hover:bg-card/80 ${
                index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' :
                index === 1 ? 'border-gray-400/50 bg-gray-400/5' :
                index === 2 ? 'border-amber-600/50 bg-amber-600/5' :
                'border-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 flex items-center justify-center font-heading text-2xl font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50' :
                  index === 2 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/50' :
                  'bg-muted text-muted-foreground border border-white/10'
                }`}>
                  #{player.rank}
                </div>
                <div>
                  <p className="font-heading text-lg font-bold text-white">{player.nickname}</p>
                  <p className="text-xs font-mono text-muted-foreground">{player.steamid}</p>
                </div>
              </div>
              <div className="flex items-center space-x-8 text-right">
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground uppercase">K/D</p>
                  <p className="font-mono text-lg font-bold text-primary">{player.kd_ratio.toFixed(2)}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-muted-foreground uppercase">KILLS</p>
                  <p className="font-mono text-lg font-bold text-white">{player.kills.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">LEVEL</p>
                  <p className="font-mono text-lg font-bold text-secondary">{player.level}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Link
              to="/apply-admin"
              data-testid="cta-apply-admin"
              className="group p-8 bg-card/50 border border-white/10 hover:border-primary/50 transition-all"
            >
              <Shield className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-2xl font-bold uppercase text-white mb-2">BECOME AN ADMIN</h3>
              <p className="text-muted-foreground mb-4">Join our team and help maintain fair gameplay for everyone.</p>
              <span className="text-primary font-heading uppercase text-sm tracking-widest flex items-center space-x-2">
                <span>APPLY NOW</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/rules"
              data-testid="cta-view-rules"
              className="group p-8 bg-card/50 border border-white/10 hover:border-secondary/50 transition-all"
            >
              <Crosshair className="w-12 h-12 text-secondary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-2xl font-bold uppercase text-white mb-2">SERVER RULES</h3>
              <p className="text-muted-foreground mb-4">Know the rules before you play. Fair play is our priority.</p>
              <span className="text-secondary font-heading uppercase text-sm tracking-widest flex items-center space-x-2">
                <span>READ RULES</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground text-sm font-mono">
            &copy; 2024 ShadowZM : Zombie Reverse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
