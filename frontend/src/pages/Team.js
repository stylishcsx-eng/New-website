import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Crown, Shield, Star } from 'lucide-react';

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

  const getRoleIcon = (role) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    } else if (lowerRole.includes('manager') || lowerRole.includes('admin')) {
      return <Shield className="w-5 h-5 text-blue-500" />;
    } else {
      return <Star className="w-5 h-5 text-purple-500" />;
    }
  };

  const getRoleColor = (role) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) {
      return 'border-yellow-500 bg-yellow-500/10';
    } else if (lowerRole.includes('manager')) {
      return 'border-blue-500 bg-blue-500/10';
    } else if (lowerRole.includes('admin')) {
      return 'border-green-500 bg-green-500/10';
    } else {
      return 'border-purple-500 bg-purple-500/10';
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
            <div className="w-16 h-16 bg-primary/20 border border-primary flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <div 
                key={member.id} 
                className={`bg-card/50 border-2 ${getRoleColor(member.role)} p-6 transition-all hover:scale-105`}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 bg-muted border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getRoleIcon(member.role)}
                      <h3 className="font-heading text-xl font-bold text-white truncate">
                        {member.name}
                      </h3>
                    </div>
                    <p className="text-primary font-heading uppercase text-sm tracking-wider mb-2">
                      {member.role}
                    </p>
                    {member.description && (
                      <p className="text-muted-foreground text-sm">
                        {member.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Social/IDs */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                  {member.steamid && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Steam: {member.steamid}
                    </p>
                  )}
                  {member.discord_id && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Discord: {member.discord_id}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
