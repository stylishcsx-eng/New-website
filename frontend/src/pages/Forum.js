import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, HelpCircle, Coffee, Plus, Pin, Lock, MessageCircle, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICONS = {
  MessageSquare: MessageSquare,
  HelpCircle: HelpCircle,
  Coffee: Coffee,
};

export const Forum = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/forum/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
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
                <p className="text-muted-foreground">Discuss with the community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
            const IconComponent = ICONS[category.icon] || MessageSquare;
            return (
              <div 
                key={category.id}
                onClick={() => navigate(`/forum/category/${category.id}`)}
                className="bg-card/50 border border-white/10 p-6 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/20 border border-primary/50 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-white uppercase group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="font-mono text-2xl font-bold text-primary">{category.topic_count}</p>
                      <p className="text-xs text-muted-foreground uppercase">Topics</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No forum categories yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ForumCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const categoryId = window.location.pathname.split('/').pop();
  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const [catRes, topicsRes] = await Promise.all([
        axios.get(`${API}/forum/categories`),
        axios.get(`${API}/forum/topics?category_id=${categoryId}`)
      ]);
      const cat = catRes.data.find(c => c.id === categoryId);
      setCategory(cat);
      setTopics(topicsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
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
        category_id: categoryId,
        title: newTopic.title,
        content: newTopic.content
      });
      setNewTopic({ title: '', content: '' });
      setShowNewTopic(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create topic', error);
      alert(error.response?.data?.detail || 'Failed to create topic');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/forum')}
                className="text-muted-foreground hover:text-white text-sm mb-2 flex items-center space-x-1"
              >
                <span>← Back to Forum</span>
              </button>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">
                {category?.name || 'Category'}
              </h1>
              <p className="text-muted-foreground">{category?.description}</p>
            </div>
            <button
              onClick={() => isAuthenticated ? setShowNewTopic(true) : navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
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
                  placeholder="Topic title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Content</label>
                <textarea
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary min-h-[150px]"
                  placeholder="Write your post..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Topic'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTopic(false)}
                  className="px-6 py-2 border border-white/20 text-white font-heading uppercase text-sm tracking-wider hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Topics List */}
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => navigate(`/forum/topic/${topic.id}`)}
              className="bg-card/50 border border-white/10 p-4 hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                  {topic.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <h4 className="font-heading text-lg text-white group-hover:text-primary transition-colors truncate">
                      {topic.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      by <span className="text-primary">{topic.author_name}</span> • {new Date(topic.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-mono">{topic.reply_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No topics yet</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first to start a discussion!</p>
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

  const handleTogglePin = async () => {
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/pin`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleToggleLock = async () => {
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/lock`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle lock', error);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            onClick={() => navigate(`/forum/category/${topic.category_id}`)}
            className="text-muted-foreground hover:text-white text-sm mb-4 flex items-center space-x-1"
          >
            <span>← Back to Category</span>
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {topic.is_pinned && <Pin className="w-5 h-5 text-yellow-500" />}
              {topic.is_locked && <Lock className="w-5 h-5 text-red-500" />}
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                {topic.title}
              </h1>
            </div>
            {isAdmin && (
              <div className="flex space-x-2">
                <button
                  onClick={handleTogglePin}
                  className={`p-2 border ${topic.is_pinned ? 'border-yellow-500 text-yellow-500' : 'border-white/20 text-white'} hover:bg-white/5`}
                  title="Toggle Pin"
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`p-2 border ${topic.is_locked ? 'border-red-500 text-red-500' : 'border-white/20 text-white'} hover:bg-white/5`}
                  title="Toggle Lock"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Original Post */}
        <div className="bg-card/50 border border-primary/50 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            {topic.author_avatar ? (
              <img src={topic.author_avatar} alt={topic.author_name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">{topic.author_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="font-heading text-white">{topic.author_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(topic.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-white whitespace-pre-wrap">{topic.content}</div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-8">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-card/50 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {reply.author_avatar ? (
                    <img src={reply.author_avatar} alt={reply.author_name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-muted flex items-center justify-center">
                      <span className="text-primary font-bold">{reply.author_name.charAt(0)}</span>
                    </div>
                  )}
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
                    Delete
                  </button>
                )}
              </div>
              <div className="text-white whitespace-pre-wrap">{reply.content}</div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {!topic.is_locked ? (
          <div className="bg-card/50 border border-white/10 p-6">
            <h3 className="font-heading text-lg font-bold text-white mb-4">POST A REPLY</h3>
            {isAuthenticated ? (
              <form onSubmit={handleReply} className="space-y-4">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary min-h-[100px]"
                  placeholder="Write your reply..."
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            ) : (
              <p className="text-muted-foreground">
                <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                  Login with Discord
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
