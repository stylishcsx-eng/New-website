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
              <Link
                to="/login"
                data-testid="nav-login"
                className="flex items-center space-x-2 px-4 py-2 text-white transition-colors font-heading text-sm uppercase tracking-widest"
                style={{ backgroundColor: '#5865F2' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>LOGIN</span>
              </Link>
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
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-white font-heading text-sm uppercase tracking-widest"
                    style={{ backgroundColor: '#5865F2' }}
                  >
                    <LogIn className="w-5 h-5" />
                    <span>LOGIN WITH DISCORD</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
