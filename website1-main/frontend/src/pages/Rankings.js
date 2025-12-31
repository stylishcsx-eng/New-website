import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Crosshair, Trophy, Target, Skull } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Rankings = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/rankings/top?limit=15`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch rankings', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.nickname.toLowerCase().includes(search.toLowerCase()) ||
    player.steamid.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING RANKINGS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2" data-testid="page-title">
            TOP 15 RANKINGS
          </h1>
          <p className="text-muted-foreground">The elite warriors of ShadowZM : Zombie Reverse</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-players"
            placeholder="Search player by nickname or SteamID..."
            className="w-full bg-card/50 border border-white/10 focus:border-primary pl-12 pr-4 py-4 text-white font-mono text-sm outline-none transition-colors"
          />
        </div>

        {/* Top 3 Showcase */}
        {!search && players.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 md:mt-8">
              <div className="bg-card/50 border border-gray-500/30 p-6 relative overflow-hidden" data-testid="rank-2-card">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/10 flex items-center justify-center">
                  <span className="font-heading text-4xl font-bold text-gray-500">2</span>
                </div>
                <div className="mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-1">{players[1]?.nickname}</h3>
                <p className="font-mono text-xs text-muted-foreground mb-4">{players[1]?.steamid}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Kills</p>
                    <p className="font-mono font-bold text-white">{players[1]?.kills.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">K/D</p>
                    <p className="font-mono font-bold text-primary">{players[1]?.kd_ratio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2">
              <div className="bg-card/50 border-2 border-yellow-500/50 p-8 relative overflow-hidden glow-red" data-testid="rank-1-card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 flex items-center justify-center">
                  <span className="font-heading text-5xl font-bold text-yellow-500">1</span>
                </div>
                <div className="mb-4 flex items-center space-x-2">
                  <Trophy className="w-10 h-10 text-yellow-500" />
                  <span className="font-heading text-sm uppercase tracking-widest text-yellow-500">Champion</span>
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-1">{players[0]?.nickname}</h3>
                <p className="font-mono text-xs text-muted-foreground mb-6">{players[0]?.steamid}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Kills</p>
                    <p className="font-mono font-bold text-white text-lg">{players[0]?.kills.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">K/D</p>
                    <p className="font-mono font-bold text-primary text-lg">{players[0]?.kd_ratio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Level</p>
                    <p className="font-mono font-bold text-secondary text-lg">{players[0]?.level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 md:mt-12">
              <div className="bg-card/50 border border-amber-600/30 p-6 relative overflow-hidden" data-testid="rank-3-card">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-600/10 flex items-center justify-center">
                  <span className="font-heading text-4xl font-bold text-amber-600">3</span>
                </div>
                <div className="mb-4">
                  <Trophy className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-1">{players[2]?.nickname}</h3>
                <p className="font-mono text-xs text-muted-foreground mb-4">{players[2]?.steamid}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Kills</p>
                    <p className="font-mono font-bold text-white">{players[2]?.kills.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">K/D</p>
                    <p className="font-mono font-bold text-primary">{players[2]?.kd_ratio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="bg-card/50 border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <Crosshair className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg uppercase tracking-widest text-white">Full Rankings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="rankings-table">
              <thead className="bg-muted/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">SteamID</th>
                  <th className="px-6 py-4 text-right font-heading text-xs text-muted-foreground uppercase tracking-wider">Kills</th>
                  <th className="px-6 py-4 text-right font-heading text-xs text-muted-foreground uppercase tracking-wider">Deaths</th>
                  <th className="px-6 py-4 text-right font-heading text-xs text-muted-foreground uppercase tracking-wider">K/D</th>
                  <th className="px-6 py-4 text-right font-heading text-xs text-muted-foreground uppercase tracking-wider">Headshots</th>
                  <th className="px-6 py-4 text-right font-heading text-xs text-muted-foreground uppercase tracking-wider">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className={`hover:bg-white/5 transition-colors ${
                      player.rank === 1 ? 'bg-yellow-500/5' :
                      player.rank === 2 ? 'bg-gray-500/5' :
                      player.rank === 3 ? 'bg-amber-600/5' : ''
                    }`}
                    data-testid={`ranking-row-${player.rank}`}
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 flex items-center justify-center font-heading font-bold ${
                        player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                        player.rank === 2 ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' :
                        player.rank === 3 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/50' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {player.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-heading font-bold text-white">{player.nickname}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{player.steamid}</td>
                    <td className="px-6 py-4 font-mono text-right text-white">{player.kills.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-right text-muted-foreground">{player.deaths.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-right font-bold text-primary">{player.kd_ratio.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-right text-muted-foreground">{player.headshots.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-right font-bold text-secondary">{player.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPlayers.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No players found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
