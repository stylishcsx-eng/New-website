import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Shield, Server, Users, Ban, FileText, UserPlus, LogIn, LogOut, Home, Crosshair, Bell, Check, Trash2, MessageSquare } from 'lucide-react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin, isAuthenticated, notifications, unreadCount, markNotificationRead, deleteNotification } = useAuth();

  const navLinks = [
    { path: '/', label: 'HOME', icon: Home },
    { path: '/server-status', label: 'SERVER', icon: Server },
    { path: '/rankings', label: 'RANKINGS', icon: Crosshair },
    { path: '/banlist', label: 'BANLIST', icon: Ban },
    { path: '/forum', label: 'FORUM', icon: MessageSquare },
    { path: '/team', label: 'TEAM', icon: Users },
    { path: '/apply-admin', label: 'APPLY', icon: UserPlus },
  ];

  const isActive = (path) => location.pathname === path;

  const getNotificationColor = (type) => {
    if (type?.includes('approved')) return 'border-green-500 bg-green-500/10';
    if (type?.includes('rejected')) return 'border-red-500 bg-red-500/10';
    return 'border-yellow-500 bg-yellow-500/10';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" data-testid="nav-logo">
            <img 
              src="/shadowzm-logo.png" 
              alt="ShadowZM Logo" 
              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,75,75,0.5)]"
            />
            <div className="hidden sm:block">
              <span className="font-heading text-xl font-bold uppercase tracking-wider text-white">ShadowZM</span>
              <span className="text-xs text-muted-foreground block -mt-1">Zombie Reverse</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                data-testid={`nav-${label.toLowerCase()}`}
                className={`px-4 py-2 font-heading text-sm uppercase tracking-widest transition-all border-b-2 ${
                  isActive(path)
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-white hover:border-white/20'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons & Notifications */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    data-testid="btn-notifications"
                    className="relative p-2 text-muted-foreground hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs flex items-center justify-center rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 shadow-xl z-50">
                      <div className="p-3 border-b border-white/10">
                        <h3 className="font-heading text-sm uppercase tracking-widest text-white">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 border-l-2 ${getNotificationColor(notif.type)} ${!notif.read ? 'bg-white/5' : ''}`}
                            >
                              <p className="text-sm text-foreground mb-1">{notif.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(notif.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex space-x-2">
                                  {!notif.read && (
                                    <button
                                      onClick={() => markNotificationRead(notif.id)}
                                      className="text-green-500 hover:text-green-400"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(notif.id)}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <Link
                    to="/admin"
                    data-testid="nav-admin-panel"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-white transition-all font-heading text-sm uppercase tracking-widest"
                  >
                    <Shield className="w-4 h-4" />
                    <span>ADMIN</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">{user?.nickname}</span>
                  <button
                    onClick={logout}
                    data-testid="nav-logout"
                    className="flex items-center space-x-1 px-3 py-2 text-muted-foreground hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  data-testid="nav-login"
                  className="px-4 py-2 text-muted-foreground hover:text-white transition-colors font-heading text-sm uppercase tracking-widest"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  data-testid="nav-register"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-colors font-heading text-sm uppercase tracking-widest"
                >
                  REGISTER
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-white"
            data-testid="nav-mobile-toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/5 py-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 font-heading text-sm uppercase tracking-widest transition-colors ${
                    isActive(path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="border-t border-white/5 pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    {/* Mobile Notifications */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 mb-2">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Notifications ({unreadCount})</p>
                        {notifications.slice(0, 3).map((notif) => (
                          <div key={notif.id} className={`p-2 mb-1 border-l-2 ${getNotificationColor(notif.type)} text-xs`}>
                            {notif.message}
                          </div>
                        ))}
                      </div>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-primary font-heading text-sm uppercase tracking-widest"
                      >
                        <Shield className="w-5 h-5" />
                        <span>ADMIN PANEL</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-white font-heading text-sm uppercase tracking-widest w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>LOGOUT ({user?.nickname})</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-white font-heading text-sm uppercase tracking-widest"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>LOGIN</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-primary font-heading text-sm uppercase tracking-widest"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>REGISTER</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
