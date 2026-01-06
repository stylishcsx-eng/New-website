import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Users, Ban, FileText, Check, X, Trash2, Shield, RefreshCw, Calendar, Edit, UserPlus, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminPanel = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit ban modal
  const [editingBan, setEditingBan] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Create admin modal
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ nickname: '', email: '', password: '', steamid: '' });

  // Application review modal
  const [reviewingApp, setReviewingApp] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'applications') {
        const response = await axios.get(`${API}/admin-applications`);
        setApplications(response.data);
      } else if (activeTab === 'users') {
        const response = await axios.get(`${API}/admin/users`);
        setUsers(response.data);
      } else if (activeTab === 'bans') {
        const response = await axios.get(`${API}/bans`);
        setBans(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (appId, status) => {
    try {
      await axios.patch(`${API}/admin-applications/${appId}`, { status });
      toast.success(`Application ${status}! Player will be notified.`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update application');
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await axios.delete(`${API}/admin-applications/${appId}`);
      toast.success('Application deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  const handleDeleteOldApplications = async () => {
    if (!window.confirm('Delete all applications older than 30 days?')) return;
    try {
      const response = await axios.delete(`${API}/admin-applications/bulk/old`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete old applications');
    }
  };

  const handleDeleteBan = async (banId) => {
    if (!window.confirm('Are you sure you want to remove this ban?')) return;
    try {
      await axios.delete(`${API}/bans/${banId}`);
      toast.success('Ban removed successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove ban');
    }
  };

  const handleEditBan = (ban) => {
    setEditingBan(ban);
    setEditForm({
      player_nickname: ban.player_nickname,
      steamid: ban.steamid,
      reason: ban.reason,
      duration: ban.duration
    });
  };

  const handleSaveBan = async () => {
    try {
      await axios.patch(`${API}/bans/${editingBan.id}`, editForm);
      toast.success('Ban updated!');
      setEditingBan(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update ban');
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.nickname || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await axios.post(`${API}/owner/create-admin`, newAdmin);
      toast.success(`Admin user '${newAdmin.nickname}' created!`);
      setShowCreateAdmin(false);
      setNewAdmin({ nickname: '', email: '', password: '', steamid: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleDeleteUser = async (userId, nickname) => {
    if (!window.confirm(`Delete user '${nickname}'? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/owner/delete-admin/${userId}`);
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.patch(`${API}/owner/update-role/${userId}?role=${newRole}`);
      toast.success(`Role updated to ${newRole}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white" data-testid="page-title">
                ADMIN PANEL
              </h1>
              {isOwner && (
                <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 text-xs font-heading uppercase">
                  <Crown className="w-4 h-4" />
                  <span>Owner</span>
                </span>
              )}
            </div>
            <p className="text-muted-foreground">Server administration and management</p>
          </div>
          <div className="flex space-x-2">
            {isOwner && (
              <button
                onClick={() => setShowCreateAdmin(true)}
                data-testid="btn-create-admin"
                className="flex items-center space-x-2 px-4 py-2 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-900/40 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-heading uppercase text-sm tracking-widest hidden sm:inline">Add Admin</span>
              </button>
            )}
            <button
              onClick={fetchData}
              data-testid="btn-refresh"
              className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-heading uppercase text-sm tracking-widest hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('applications')}
            data-testid="tab-applications"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'applications'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="tab-users"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'users'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            data-testid="tab-bans"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'bans'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            Bans
          </button>
        </div>

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <UserPlus className="w-6 h-6 text-green-500" />
                <span>Create Admin User</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Nickname *</label>
                  <input
                    type="text"
                    value={newAdmin.nickname}
                    onChange={(e) => setNewAdmin({...newAdmin, nickname: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                    placeholder="AdminName"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Password *</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">SteamID (Optional)</label>
                  <input
                    type="text"
                    value={newAdmin.steamid}
                    onChange={(e) => setNewAdmin({...newAdmin, steamid: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                    placeholder="STEAM_0:1:123456"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateAdmin}
                  className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-500 border border-green-500/50 py-3 font-heading uppercase"
                >
                  Create Admin
                </button>
                <button
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Ban Modal */}
        {editingBan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-white/10 p-6 w-full max-w-md">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 flex items-center space-x-2">
                <Edit className="w-6 h-6 text-primary" />
                <span>Edit Ban</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Player Nickname</label>
                  <input
                    type="text"
                    value={editForm.player_nickname}
                    onChange={(e) => setEditForm({...editForm, player_nickname: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">SteamID</label>
                  <input
                    type="text"
                    value={editForm.steamid}
                    onChange={(e) => setEditForm({...editForm, steamid: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Reason</label>
                  <input
                    type="text"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase mb-2">Duration</label>
                  <select
                    value={editForm.duration}
                    onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="10 minutes">10 minutes</option>
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="6 hours">6 hours</option>
                    <option value="12 hours">12 hours</option>
                    <option value="1 day">1 day</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                    <option value="14 days">14 days</option>
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveBan}
                  className="flex-1 bg-primary/30 hover:bg-primary/50 text-primary border border-primary/50 py-3 font-heading uppercase"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingBan(null)}
                  className="flex-1 bg-muted/30 hover:bg-muted/50 text-white border border-white/10 py-3 font-heading uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-primary font-heading text-xl uppercase tracking-widest">LOADING...</div>
          </div>
        ) : (
          <div>
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleDeleteOldApplications}
                    data-testid="btn-delete-old-apps"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/40 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-heading uppercase text-sm">Delete 30+ Days Old</span>
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="text-center py-16 bg-card/50 border border-white/10">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No applications found</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-card/50 border border-white/10 p-6 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-xl font-bold text-white">{app.nickname}</h3>
                          <p className="font-mono text-xs text-muted-foreground mt-1">{app.steamid}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs font-heading uppercase tracking-wider ${
                            app.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/50' :
                            app.status === 'approved' ? 'bg-green-900/30 text-green-500 border border-green-500/50' :
                            'bg-red-900/30 text-red-500 border border-red-500/50'
                          }`}>
                            {app.status}
                          </span>
                          <button onClick={() => handleDeleteApplication(app.id)} className="text-red-500 hover:text-red-400 p-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Age</p>
                          <p className="text-white">{app.age} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Submitted</p>
                          <p className="text-white font-mono text-xs">{format(new Date(app.submitted_at), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Experience</p>
                        <p className="text-foreground text-sm bg-muted/30 p-3">{app.experience}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Reason</p>
                        <p className="text-foreground text-sm bg-muted/30 p-3">{app.reason}</p>
                      </div>
                      {app.status === 'pending' && (
                        <div className="flex space-x-3 pt-4 border-t border-white/10">
                          <button onClick={() => handleApplicationStatus(app.id, 'approved')} className="flex items-center space-x-2 bg-green-900/30 hover:bg-green-900/50 text-green-500 border border-green-500/50 px-4 py-2">
                            <Check className="w-4 h-4" /><span className="font-heading uppercase text-sm">Approve</span>
                          </button>
                          <button onClick={() => handleApplicationStatus(app.id, 'rejected')} className="flex items-center space-x-2 bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-500/50 px-4 py-2">
                            <X className="w-4 h-4" /><span className="font-heading uppercase text-sm">Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-card/50 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Nickname</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Email</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">SteamID</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Role</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Registered</th>
                        {isOwner && <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-heading font-bold text-white">{u.nickname}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{u.email}</td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{u.steamid || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-heading uppercase ${
                              u.role === 'owner' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                              u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/50' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {format(new Date(u.created_at), 'MMM dd, yyyy')}
                          </td>
                          {isOwner && (
                            <td className="px-6 py-4">
                              {u.role !== 'owner' && (
                                <div className="flex space-x-2">
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                    className="bg-muted/50 border border-white/10 text-white text-xs px-2 py-1"
                                  >
                                    <option value="player">Player</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button onClick={() => handleDeleteUser(u.id, u.nickname)} className="text-red-500 hover:text-red-400 p-1">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bans Tab */}
            {activeTab === 'bans' && (
              <div className="bg-card/50 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Player</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">SteamID</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Reason</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Duration</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bans.map((ban) => (
                        <tr key={ban.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-heading font-bold text-white">{ban.player_nickname}</td>
                          <td className="px-6 py-4 font-mono text-xs text-primary">{ban.steamid}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{ban.reason}</td>
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{ban.duration}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEditBan(ban)} className="text-primary hover:text-primary/80 p-2">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteBan(ban.id)} className="text-red-500 hover:text-red-400 p-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bans.length === 0 && (
                  <div className="text-center py-16">
                    <Ban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No bans found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
