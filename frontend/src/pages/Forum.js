import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Plus, Pin, Lock, MessageCircle, Trash2, User, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Forum = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API}/forum/topics`);
      setTopics(response.data);
    } catch (error) {
      console.error('Failed to fetch topics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/forum/topics`, {
        title: newTopic.title,
        content: newTopic.content
      });
      setNewTopic({ title: '', content: '' });
      setShowNewTopic(false);
      fetchTopics();
    } catch (error) {
      console.error('Failed to create topic', error);
      alert(error.response?.data?.detail || 'Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this topic?')) return;
    try {
      await axios.delete(`${API}/forum/topics/${topicId}`);
      fetchTopics();
    } catch (error) {
      console.error('Failed to delete topic', error);
    }
  };

  const handleTogglePin = async (topicId, e) => {
    e.stopPropagation();
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/pin`);
      fetchTopics();
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleToggleLock = async (topicId, e) => {
    e.stopPropagation();
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/lock`);
      fetchTopics();
    } catch (error) {
      console.error('Failed to toggle lock', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-primary font-heading text-2xl uppercase tracking-widest">LOADING FORUM...</div>
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/20 border border-primary flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2">
                  FORUM
                </h1>
                <p className="text-muted-foreground">Discuss with the community • {topics.length} topics</p>
              </div>
            </div>
            <button
              onClick={() => isAuthenticated ? setShowNewTopic(true) : navigate('/login')}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Topic</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* New Topic Form */}
        {showNewTopic && (
          <div className="bg-card/50 border border-primary/50 p-6 mb-6">
            <h3 className="font-heading text-xl font-bold text-white mb-4">CREATE NEW TOPIC</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="What's on your mind?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Content</label>
                <textarea
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary min-h-[150px]"
                  placeholder="Share your thoughts..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Post Topic'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTopic(false)}
                  className="px-6 py-3 border border-white/20 text-white font-heading uppercase text-sm tracking-wider hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Topics List */}
        {topics.length === 0 ? (
          <div className="text-center py-16 bg-card/30 border border-white/10">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No topics yet</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/forum/topic/${topic.id}`)}
                className={`bg-card/50 border ${topic.is_pinned ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10'} p-4 hover:border-primary/50 transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                      {topic.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <h3 className="font-heading text-lg text-white group-hover:text-primary transition-colors truncate">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {topic.content}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="text-primary">{topic.author_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{topic.reply_count} replies</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={(e) => handleTogglePin(topic.id, e)}
                        className={`p-2 ${topic.is_pinned ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                        title="Toggle Pin"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleToggleLock(topic.id, e)}
                        className={`p-2 ${topic.is_locked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        title="Toggle Lock"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTopic(topic.id, e)}
                        className="p-2 text-muted-foreground hover:text-red-500"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export const ForumTopic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const topicId = window.location.pathname.split('/').pop();
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [topicId]);

  const fetchData = async () => {
    try {
      const [topicRes, repliesRes] = await Promise.all([
        axios.get(`${API}/forum/topics/${topicId}`),
        axios.get(`${API}/forum/replies/${topicId}`)
      ]);
      setTopic(topicRes.data);
      setReplies(repliesRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/forum/replies`, {
        topic_id: topicId,
        content: newReply
      });
      setNewReply('');
      fetchData();
    } catch (error) {
      console.error('Failed to post reply', error);
      alert(error.response?.data?.detail || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await axios.delete(`${API}/forum/replies/${replyId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete reply', error);
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

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <div className="text-center">
          <p className="text-muted-foreground">Topic not found</p>
          <button onClick={() => navigate('/forum')} className="text-primary hover:underline mt-4">
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button 
            onClick={() => navigate('/forum')}
            className="text-muted-foreground hover:text-white text-sm mb-4 flex items-center space-x-1"
          >
            <span>← Back to Forum</span>
          </button>
          <div className="flex items-center space-x-3">
            {topic.is_pinned && <Pin className="w-5 h-5 text-yellow-500" />}
            {topic.is_locked && <Lock className="w-5 h-5 text-red-500" />}
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              {topic.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Original Post */}
        <div className="bg-card/50 border border-primary/50 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 flex items-center justify-center rounded-full">
              <span className="text-primary font-bold text-lg">{topic.author_name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-heading text-white text-lg">{topic.author_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(topic.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-white whitespace-pre-wrap leading-relaxed">{topic.content}</div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading text-lg uppercase tracking-wider text-muted-foreground mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h3>
            <div className="space-y-3">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-card/50 border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-full">
                        <span className="text-primary font-bold">{reply.author_name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-heading text-white">{reply.author_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {(reply.author_id === user?.id || isAdmin) && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-white whitespace-pre-wrap">{reply.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {!topic.is_locked ? (
          <div className="bg-card/50 border border-white/10 p-6">
            <h3 className="font-heading text-lg font-bold text-white mb-4">POST A REPLY</h3>
            {isAuthenticated ? (
              <form onSubmit={handleReply} className="space-y-4">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary min-h-[120px]"
                  placeholder="Write your reply..."
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            ) : (
              <p className="text-muted-foreground">
                <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                  Login
                </button> to reply
              </p>
            )}
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/50 p-4 text-center">
            <Lock className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-400">This topic is locked. No new replies can be posted.</p>
          </div>
        )}
      </div>
    </div>
  );
};
