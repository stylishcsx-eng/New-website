import { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Users, Map, Wifi, Clock, RefreshCw, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ServerStatus = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API}/server-status`);
      setServerStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch server status', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">QUERYING SERVER...</div>
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1658713981078-cc13b54dd40c?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2" data-testid="page-title">
                SERVER STATUS
              </h1>
              <p className="text-muted-foreground">Real-time monitoring of ShadowZM : Zombie Reverse</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              data-testid="btn-refresh-status"
              className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-heading uppercase text-sm tracking-widest hidden sm:inline">REFRESH</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Status Card */}
        <div className="bg-card/50 border border-white/10 p-8 mb-8" data-testid="server-status-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className={`w-16 h-16 flex items-center justify-center ${
                serverStatus?.online ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'
              } border`}>
                <Server className={`w-8 h-8 ${serverStatus?.online ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-white uppercase">{serverStatus?.server_name}</h2>
                <p className="font-mono text-muted-foreground">{serverStatus?.server_ip}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${serverStatus?.online ? 'bg-green-500 pulse-online' : 'bg-red-500'}`} />
              <span className={`font-heading text-xl uppercase tracking-widest ${
                serverStatus?.online ? 'text-green-500' : 'text-red-500'
              }`}>
                {serverStatus?.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 bg-muted/50 border border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                <Map className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Map</span>
              </div>
              <p className="font-mono text-xl font-bold text-primary" data-testid="current-map">{serverStatus?.current_map || 'N/A'}</p>
            </div>
            <div className="p-4 bg-muted/50 border border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-secondary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Players</span>
              </div>
              <p className="font-mono text-xl font-bold text-white" data-testid="players-count">
                {serverStatus?.players_online || 0}
                <span className="text-muted-foreground">/{serverStatus?.max_players || 32}</span>
              </p>
            </div>
            <div className="p-4 bg-muted/50 border border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                <Wifi className="w-5 h-5 text-yellow-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Ping</span>
              </div>
              <p className="font-mono text-xl font-bold text-white" data-testid="server-ping">{serverStatus?.ping || 0}ms</p>
            </div>
            <div className="p-4 bg-muted/50 border border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              </div>
              <p className="font-mono text-xl font-bold text-green-500">LIVE</p>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <div className="text-center mb-12">
          <a
            href={`steam://connect/${serverStatus?.server_ip}`}
            data-testid="btn-quick-connect"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-primary text-white font-heading text-lg uppercase tracking-widest hover:bg-primary/90 transition-colors glow-red"
          >
            <Zap className="w-6 h-6" />
            <span>QUICK CONNECT</span>
          </a>
          <p className="text-muted-foreground text-sm mt-3 font-mono">
            Or connect manually: <code className="text-primary">{serverStatus?.server_ip}</code>
          </p>
        </div>

        {/* Online Players */}
        <div className="bg-card/50 border border-white/10 p-8">
          <h3 className="font-heading text-2xl font-bold uppercase text-white mb-6 flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary" />
            <span>ONLINE PLAYERS ({serverStatus?.players?.length || 0})</span>
          </h3>
          
          {serverStatus?.players && serverStatus.players.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="online-players-table">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading text-sm text-muted-foreground uppercase tracking-wider">Player</th>
                    <th className="text-right py-3 px-4 font-heading text-sm text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="text-right py-3 px-4 font-heading text-sm text-muted-foreground uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {serverStatus.players.map((player, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors" data-testid={`online-player-${index}`}>
                      <td className="py-3 px-4 font-mono text-white">{player.name || 'Unknown'}</td>
                      <td className="py-3 px-4 font-mono text-primary text-right">{player.score}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground text-right">
                        {Math.floor(player.duration / 60)}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-heading uppercase">No players online</p>
              <p className="text-sm text-muted-foreground/50 mt-2">Be the first to join!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
