import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Users, Crown, Shield, UserPlus, Trash2, Edit, ChevronRight, Plus, Save, X, Settings } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default role colors
const defaultRoleColors = {
  owner: '#ef4444',   // Red
  admin: '#22c55e',   // Green
  moderator: '#3b82f6', // Blue
  member: '#a855f7'   // Purple
};

// Get role color - first check role config, then defaults
const getRoleColor = (roleType, roleConfigs = []) => {
  const config = roleConfigs.find(r => r.name.toLowerCase() === roleType?.toLowerCase());
  if (config) return config.color;
  return defaultRoleColors[roleType?.toLowerCase()] || defaultRoleColors.member;
};

// Get role icon based on type
const getRoleIcon = (roleType) => {
  switch(roleType?.toLowerCase()) {
    case 'owner': return Crown;
    case 'admin': return Shield;
    case 'moderator': return Shield;
    default: return Users;
  }
};

export const Team = () => {
  const { isAdmin, isOwner } = useAuth();
  const [members, setMembers] = useState([]);
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showManageRoles, setShowManageRoles] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'Member',
    role_type: 'member',
    steamid: '',
    avatar: '',
    description: ''
  });
  const [newRole, setNewRole] = useState({ name: '', color: '#ffffff' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, rolesRes] = await Promise.all([
        axios.get(`${API}/team`),
        axios.get(`${API}/team/roles`)
      ]);
      setMembers(membersRes.data);
      setRoleConfigs(rolesRes.data);
    } catch (error) {
      console.error('Failed to fetch team data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/team`, {
        ...newMember,
        order: members.length + 1
      });
      toast.success('Team member added!');
      setShowAddMember(false);
      setNewMember({ name: '', role: 'Member', role_type: 'member', steamid: '', avatar: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleUpdateMember = async () => {
    try {
      await axios.patch(`${API}/team/${editingMember.id}`, editingMember);
      toast.success('Member updated!');
      setEditingMember(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update member');
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the team?`)) return;
    try {
      await axios.delete(`${API}/team/${memberId}`);
      toast.success('Member removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/team/roles`, {
        ...newRole,
        order: roleConfigs.length + 1
      });
      toast.success('Role added!');
      setNewRole({ name: '', color: '#ffffff' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await axios.delete(`${API}/team/roles/${roleId}`);
      toast.success('Role deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  // Group members by role type
  const groupedMembers = {};
  members.forEach(member => {
    const roleType = member.role_type || 'member';
    if (!groupedMembers[roleType]) {
      groupedMembers[roleType] = [];
    }
    groupedMembers[roleType].push(member);
  });

  // Order: owners first, then admins, then others
  const roleOrder = ['owner', 'admin', 'moderator', 'member'];
  const orderedRoles = Object.keys(groupedMembers).sort((a, b) => {
    return roleOrder.indexOf(a.toLowerCase()) - roleOrder.indexOf(b.toLowerCase());
  });

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
          <div className="flex items-center justify-between">
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
            
            {isAdmin && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowManageRoles(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all font-heading uppercase text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Roles</span>
                </button>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all font-heading uppercase text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Member</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <UserPlus className="w-6 h-6 text-green-500" />
                <span>Add Team Member</span>
              </h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Name *</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="Player name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground uppercase mb-2">Role Title</label>
                    <input
                      type="text"
                      value={newMember.role}
                      onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                      placeholder="e.g. Owner, Admin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground uppercase mb-2">Role Type</label>
                    <select
                      value={newMember.role_type}
                      onChange={(e) => setNewMember({...newMember, role_type: e.target.value})}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    >
                      <option value="owner">Owner (Red)</option>
                      <option value="admin">Admin (Green)</option>
                      <option value="moderator">Moderator (Blue)</option>
                      <option value="member">Member (Purple)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">SteamID</label>
                  <input
                    type="text"
                    value={newMember.steamid}
                    onChange={(e) => setNewMember({...newMember, steamid: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="STEAM_0:1:123456"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={newMember.avatar}
                    onChange={(e) => setNewMember({...newMember, avatar: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Description</label>
                  <textarea
                    value={newMember.description}
                    onChange={(e) => setNewMember({...newMember, description: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500 h-20"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 font-heading uppercase"
                  >
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <Edit className="w-6 h-6 text-primary" />
                <span>Edit Member</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Name</label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground uppercase mb-2">Role Title</label>
                    <input
                      type="text"
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground uppercase mb-2">Role Type</label>
                    <select
                      value={editingMember.role_type}
                      onChange={(e) => setEditingMember({...editingMember, role_type: e.target.value})}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                    >
                      <option value="owner">Owner (Red)</option>
                      <option value="admin">Admin (Green)</option>
                      <option value="moderator">Moderator (Blue)</option>
                      <option value="member">Member (Purple)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">SteamID</label>
                  <input
                    type="text"
                    value={editingMember.steamid || ''}
                    onChange={(e) => setEditingMember({...editingMember, steamid: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={editingMember.avatar || ''}
                    onChange={(e) => setEditingMember({...editingMember, avatar: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Description</label>
                  <textarea
                    value={editingMember.description || ''}
                    onChange={(e) => setEditingMember({...editingMember, description: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary h-20"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleUpdateMember}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 font-heading uppercase flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Roles Modal */}
        {showManageRoles && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-purple-500" />
                <span>Manage Roles</span>
              </h2>
              
              {/* Existing Roles */}
              <div className="space-y-2 mb-6">
                {roleConfigs.map((role) => (
                  <div 
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-muted/30 border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-white font-heading">{role.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Role */}
              <form onSubmit={handleAddRole} className="space-y-4 border-t border-white/10 pt-4">
                <h3 className="font-heading text-sm uppercase text-muted-foreground">Add New Role</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-2 text-white outline-none focus:border-purple-500"
                      placeholder="Role name"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="color"
                      value={newRole.color}
                      onChange={(e) => setNewRole({...newRole, color: e.target.value})}
                      className="w-full h-10 bg-muted/50 border border-white/10 cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 font-heading uppercase text-sm"
                >
                  Add Role
                </button>
              </form>

              <button
                onClick={() => setShowManageRoles(false)}
                className="w-full mt-4 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Team Members by Role */}
        {members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No team members yet</p>
          </div>
        ) : (
          <div className="space-y-12">
            {orderedRoles.map((roleType) => {
              const roleMembers = groupedMembers[roleType];
              const roleColor = getRoleColor(roleType, roleConfigs);
              const RoleIcon = getRoleIcon(roleType);
              const roleLabel = roleType.charAt(0).toUpperCase() + roleType.slice(1) + 's';

              return (
                <div key={roleType}>
                  {/* Role Header */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div 
                      className="w-10 h-10 flex items-center justify-center border"
                      style={{ 
                        backgroundColor: `${roleColor}20`,
                        borderColor: roleColor 
                      }}
                    >
                      <RoleIcon className="w-5 h-5" style={{ color: roleColor }} />
                    </div>
                    <h2 
                      className="font-heading text-2xl uppercase tracking-wider"
                      style={{ color: roleColor }}
                    >
                      {roleLabel}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, ${roleColor}50, transparent)` }} />
                  </div>

                  {/* Members Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roleMembers.map((member) => {
                      const memberColor = getRoleColor(member.role_type, roleConfigs);
                      
                      return (
                        <div 
                          key={member.id} 
                          className="bg-card/50 border-2 hover:scale-105 p-6 transition-all text-center group relative"
                          style={{ 
                            borderColor: `${memberColor}50`,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = memberColor}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = `${memberColor}50`}
                        >
                          {/* Admin Controls */}
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingMember(member)}
                                className="p-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Avatar */}
                          <Link 
                            to={member.user_id ? `/profile/${member.user_id}` : '#'}
                            className={member.user_id ? 'cursor-pointer' : 'cursor-default'}
                          >
                            <div 
                              className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 transition-colors bg-muted"
                              style={{ borderColor: `${memberColor}50` }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = memberColor}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = `${memberColor}50`}
                            >
                              {member.avatar ? (
                                <img 
                                  src={member.avatar} 
                                  alt={member.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ background: `linear-gradient(135deg, ${memberColor}20, ${memberColor}10)` }}
                                >
                                  <span 
                                    className="text-4xl font-bold"
                                    style={{ color: memberColor }}
                                  >
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                          
                          {/* Info */}
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <RoleIcon className="w-5 h-5" style={{ color: memberColor }} />
                            <h3 className="font-heading text-xl font-bold text-white">
                              {member.name}
                            </h3>
                          </div>
                          
                          <p 
                            className="font-heading uppercase text-sm tracking-widest mb-3"
                            style={{ color: memberColor }}
                          >
                            {member.role}
                          </p>
                          
                          {member.description && (
                            <p className="text-muted-foreground text-sm mb-3">
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

                          {/* View Profile Link - only show if linked to user */}
                          {member.user_id && (
                            <Link 
                              to={`/profile/${member.user_id}`}
                              className="mt-4 flex items-center justify-center space-x-1 text-sm hover:underline group-hover:opacity-100 opacity-70 transition-opacity"
                              style={{ color: memberColor }}
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
