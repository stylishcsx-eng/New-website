import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageCircle, X, Minimize2, Maximize2, Smile, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Format time
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Get role color
const getRoleColor = (role) => {
  switch(role?.toLowerCase()) {
    case 'owner': return 'text-red-500';
    case 'admin': return 'text-green-500';
    case 'moderator': return 'text-blue-500';
    default: return 'text-primary';
  }
};

export const Chatbox = () => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 3 seconds
    pollInterval.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollInterval.current);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/chat/messages?limit=50`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/chat/messages`, { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/chat/messages/${messageId}`);
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 right-4 z-50 w-80 md:w-96 bg-card border border-white/10 shadow-2xl transition-all ${isMinimized ? 'h-12' : 'h-96'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-primary/20 border-b border-white/10 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-heading text-white uppercase text-sm tracking-wider">Chatbox</span>
          <span className="text-xs text-muted-foreground">({messages.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="text-muted-foreground hover:text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="text-muted-foreground hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3 bg-background/50">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="group">
                  <div className="flex items-start space-x-2">
                    {/* Avatar */}
                    <Link to={`/profile/${msg.user_id}`}>
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {msg.user_avatar ? (
                          <img src={msg.user_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold text-xs">{msg.user_name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link to={`/profile/${msg.user_id}`} className={`font-heading text-sm hover:underline ${getRoleColor(msg.user_role)}`}>
                          {msg.user_name}
                        </Link>
                        {msg.user_role && msg.user_role !== 'player' && (
                          <span className={`text-[10px] px-1 py-0.5 uppercase ${
                            msg.user_role === 'owner' ? 'bg-red-500/20 text-red-500' :
                            msg.user_role === 'admin' ? 'bg-green-500/20 text-green-500' :
                            msg.user_role === 'moderator' ? 'bg-blue-500/20 text-blue-500' :
                            ''
                          }`}>
                            {msg.user_role}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-sm text-white break-words">{msg.content}</p>
                      
                      {/* Image/GIF preview */}
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="" 
                          className="mt-2 max-w-full max-h-32 rounded object-contain cursor-pointer hover:opacity-80"
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      )}
                    </div>
                    
                    {/* Delete button for own messages or admin */}
                    {(msg.user_id === user?.id || user?.role === 'admin' || user?.role === 'owner') && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-1 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-card">
            {isAuthenticated ? (
              <form onSubmit={handleSend} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted/50 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-primary"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-primary text-white p-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                <Link to="/login" className="text-primary hover:underline">Login</Link> to chat
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
