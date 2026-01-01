import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Crown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`${API}/team`);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch team', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING TEAM...</div>
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2">
                OUR TEAM
              </h1>
              <p className="text-muted-foreground">Meet the people behind ShadowZM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No team members yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="bg-card/50 border-2 border-yellow-500/50 hover:border-yellow-500 p-6 transition-all hover:scale-105 text-center group"
              >
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-500/50 group-hover:border-yellow-500 transition-colors bg-muted">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-primary/20">
                      <span className="text-5xl font-bold text-yellow-500">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-heading text-2xl font-bold text-white">
                    {member.name}
                  </h3>
                </div>
                
                <p className="text-yellow-500 font-heading uppercase text-sm tracking-widest mb-3">
                  {member.role}
                </p>
                
                {member.description && (
                  <p className="text-muted-foreground text-sm">
                    {member.description}
                  </p>
                )}

                {/* Steam ID */}
                {member.steamid && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground font-mono">
                      {member.steamid}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
