import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, Plus, Pin, Lock, MessageCircle, Trash2, User, Clock, 
  Eye, Megaphone, HelpCircle, Scale, Coffee, ChevronRight, ArrowLeft,
  Settings, FolderPlus, Edit, Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Icon mapping for categories
const iconMap = {
  Megaphone: Megaphone,
  MessageSquare: MessageSquare,
  HelpCircle: HelpCircle,
  Scale: Scale,
  Coffee: Coffee,
  Users: Users
};

// Format relative time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Main Forum Page with Categories
export const Forum = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'MessageSquare' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, recentRes] = await Promise.all([
        axios.get(`${API}/forum/categories`),
        axios.get(`${API}/forum/topics/recent?limit=5`)
      ]);
      setCategories(catRes.data);
      setRecentTopics(recentRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/forum/categories`, newCategory);
      setNewCategory({ name: '', description: '', icon: 'MessageSquare' });
      setShowNewCategory(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create category', error);
      alert(error.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and ALL its topics? This cannot be undone!')) return;
    try {
      await axios.delete(`${API}/forum/categories/${categoryId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category', error);
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

  // Calculate total stats
  const totalTopics = categories.reduce((acc, cat) => acc + (cat.topic_count || 0), 0);
  const totalPosts = categories.reduce((acc, cat) => acc + (cat.post_count || 0), 0);

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
                <p className="text-muted-foreground">
                  {totalTopics} topics • {totalPosts} posts • Join the discussion!
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewCategory(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all font-heading uppercase text-sm tracking-wider"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Category</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin: New Category Form */}
        {showNewCategory && isAdmin && (
          <div className="bg-card/50 border border-green-500/50 p-6 mb-6">
            <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-green-500" />
              <span>CREATE NEW CATEGORY</span>
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="Category name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                  >
                    <option value="MessageSquare">💬 Message</option>
                    <option value="Megaphone">📢 Megaphone</option>
                    <option value="HelpCircle">❓ Help</option>
                    <option value="Scale">⚖️ Scale</option>
                    <option value="Coffee">☕ Coffee</option>
                    <option value="Users">👥 Users</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="Brief description of this category"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-500 text-white font-heading uppercase text-sm tracking-wider hover:bg-green-600 transition-colors"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="px-6 py-3 border border-white/20 text-white font-heading uppercase text-sm tracking-wider hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-card/80 border border-white/10 text-xs text-muted-foreground uppercase tracking-wider font-heading">
            <div className="col-span-6">Forum</div>
            <div className="col-span-2 text-center">Topics</div>
            <div className="col-span-2 text-center">Posts</div>
            <div className="col-span-2">Last Post</div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16 bg-card/30 border border-white/10">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-heading uppercase">No categories yet</p>
              {isAdmin && <p className="text-sm text-muted-foreground mt-2">Create a category to get started!</p>}
            </div>
          ) : (
            categories.map((category) => {
              const IconComponent = iconMap[category.icon] || MessageSquare;
              return (
                <div 
                  key={category.id}
                  className="bg-card/50 border border-white/10 hover:border-primary/50 transition-all group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5">
                    {/* Category Info */}
                    <div className="col-span-1 md:col-span-6">
                      <Link 
                        to={`/forum/category/${category.id}`}
                        className="flex items-start space-x-4"
                      >
                        <div className="w-12 h-12 bg-primary/20 border border-primary/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-lg text-white group-hover:text-primary transition-colors flex items-center space-x-2">
                            <span>{category.name}</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="mt-2 ml-16 text-red-500 hover:text-red-400 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {/* Topics Count */}
                    <div className="col-span-1 md:col-span-2 flex md:flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{category.topic_count || 0}</span>
                      <span className="text-xs text-muted-foreground uppercase ml-2 md:ml-0">Topics</span>
                    </div>

                    {/* Posts Count */}
                    <div className="col-span-1 md:col-span-2 flex md:flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{category.post_count || 0}</span>
                      <span className="text-xs text-muted-foreground uppercase ml-2 md:ml-0">Posts</span>
                    </div>

                    {/* Last Post */}
                    <div className="col-span-1 md:col-span-2">
                      {category.last_post ? (
                        <div className="text-sm">
                          <Link 
                            to={`/forum/topic/${category.last_post.topic_id}`}
                            className="text-white hover:text-primary truncate block"
                          >
                            {category.last_post.topic_title}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="text-primary">{category.last_post.author}</span>
                            <span className="mx-1">•</span>
                            <span>{formatRelativeTime(category.last_post.date)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No posts yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Activity */}
        {recentTopics.length > 0 && (
          <div className="mt-8">
            <h2 className="font-heading text-xl uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </h2>
            <div className="space-y-2">
              {recentTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/forum/topic/${topic.id}`}
                  className="block bg-card/30 border border-white/5 hover:border-primary/30 p-4 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                        {topic.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <h4 className="text-white group-hover:text-primary truncate">{topic.title}</h4>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-primary">{topic.author_name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(topic.created_at)}</span>
                        <span>•</span>
                        <span>{topic.reply_count} replies</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Category Topics Page
export const ForumCategory = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { isAuthenticated, isAdmin, user } = useAuth();
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

  const handleDeleteTopic = async (topicId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete this topic?')) return;
    try {
      await axios.delete(`${API}/forum/topics/${topicId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete topic', error);
    }
  };

  const handleTogglePin = async (topicId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/pin`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleToggleLock = async (topicId, e) => {
    e.stopPropagation();
    e.preventDefault();
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

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <div className="text-center">
          <p className="text-muted-foreground">Category not found</p>
          <Link to="/forum" className="text-primary hover:underline mt-4 inline-block">
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[category.icon] || MessageSquare;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/forum" className="text-muted-foreground hover:text-white text-sm mb-4 flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Forum</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-primary/20 border border-primary flex items-center justify-center">
                <IconComponent className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
                  {category.name}
                </h1>
                <p className="text-muted-foreground mt-1">{category.description}</p>
              </div>
            </div>
            <button
              onClick={() => isAuthenticated ? setShowNewTopic(true) : navigate('/login')}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Topic</span>
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
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-card/80 border border-white/10 text-xs text-muted-foreground uppercase tracking-wider font-heading">
              <div className="col-span-6">Topic</div>
              <div className="col-span-2 text-center">Replies</div>
              <div className="col-span-2 text-center">Views</div>
              <div className="col-span-2">Last Reply</div>
            </div>

            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/forum/topic/${topic.id}`}
                className={`block bg-card/50 border ${topic.is_pinned ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10'} hover:border-primary/50 transition-all group`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4">
                  {/* Topic Info */}
                  <div className="col-span-1 md:col-span-6">
                    <div className="flex items-start space-x-3">
                      {/* Author Avatar */}
                      <div className="w-10 h-10 bg-primary/20 flex items-center justify-center flex-shrink-0 rounded-full">
                        {topic.author_avatar ? (
                          <img src={topic.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold">{topic.author_name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                          {topic.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          <h3 className="font-heading text-white group-hover:text-primary transition-colors truncate">
                            {topic.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Link 
                            to={`/profile/${topic.author_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            {topic.author_name}
                          </Link>
                          {topic.author_role && (
                            <span className={`px-1.5 py-0.5 text-xs uppercase ${
                              topic.author_role === 'owner' ? 'bg-red-500/20 text-red-500' :
                              topic.author_role === 'admin' ? 'bg-green-500/20 text-green-500' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {topic.author_role}
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatRelativeTime(topic.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="flex items-center space-x-1 ml-13 mt-2">
                        <button
                          onClick={(e) => handleTogglePin(topic.id, e)}
                          className={`p-1.5 ${topic.is_pinned ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                          title="Toggle Pin"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleToggleLock(topic.id, e)}
                          className={`p-1.5 ${topic.is_locked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                          title="Toggle Lock"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTopic(topic.id, e)}
                          className="p-1.5 text-muted-foreground hover:text-red-500"
                          title="Delete Topic"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-center">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-bold text-white">{topic.reply_count}</span>
                    </div>
                  </div>

                  {/* Views */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-center">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="font-bold text-white">{topic.view_count || 0}</span>
                    </div>
                  </div>

                  {/* Last Reply */}
                  <div className="col-span-1 md:col-span-2">
                    {topic.last_reply_at ? (
                      <div className="text-sm">
                        <span className="text-primary">{topic.last_reply_by}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(topic.last_reply_at)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No replies</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Topic Detail Page
export const ForumTopic = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { isAuthenticated, user, isAdmin } = useAuth();
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

  const getRoleBadge = (role) => {
    if (!role) return null;
    const colors = {
      owner: 'bg-red-500/20 text-red-500 border-red-500/50',
      admin: 'bg-green-500/20 text-green-500 border-green-500/50',
      player: 'bg-muted text-muted-foreground border-white/10'
    };
    return (
      <span className={`px-2 py-0.5 text-xs uppercase tracking-wider border ${colors[role] || colors.player}`}>
        {role}
      </span>
    );
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
          <Link to="/forum" className="text-primary hover:underline mt-4 inline-block">
            Back to Forum
          </Link>
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
            onClick={() => topic.category_id ? navigate(`/forum/category/${topic.category_id}`) : navigate('/forum')}
            className="text-muted-foreground hover:text-white text-sm mb-4 flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-3">
            {topic.is_pinned && <Pin className="w-5 h-5 text-yellow-500" />}
            {topic.is_locked && <Lock className="w-5 h-5 text-red-500" />}
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              {topic.title}
            </h1>
          </div>
          <div className="flex items-center space-x-3 mt-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{topic.view_count || 0} views</span>
            <span>•</span>
            <MessageCircle className="w-4 h-4" />
            <span>{topic.reply_count} replies</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Original Post */}
        <div className="bg-card/50 border border-primary/50 mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Author Sidebar */}
            <div className="w-full md:w-48 bg-primary/10 border-b md:border-b-0 md:border-r border-primary/30 p-4 flex md:flex-col items-center md:items-center text-center">
              <Link to={`/profile/${topic.author_id}`} className="block">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 flex items-center justify-center rounded-full mx-auto border-2 border-primary/50">
                  {topic.author_avatar ? (
                    <img src={topic.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-2xl">{topic.author_name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="font-heading text-white mt-2 hover:text-primary">{topic.author_name}</p>
              </Link>
              <div className="ml-4 md:ml-0 md:mt-2">
                {getRoleBadge(topic.author_role)}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(topic.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-white whitespace-pre-wrap leading-relaxed">{topic.content}</div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading text-lg uppercase tracking-wider text-muted-foreground mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h3>
            <div className="space-y-3">
              {replies.map((reply, index) => (
                <div key={reply.id} className="bg-card/50 border border-white/10">
                  <div className="flex flex-col md:flex-row">
                    {/* Author Sidebar */}
                    <div className="w-full md:w-48 bg-muted/30 border-b md:border-b-0 md:border-r border-white/10 p-4 flex md:flex-col items-center text-center">
                      <Link to={`/profile/${reply.author_id}`} className="block">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-muted flex items-center justify-center rounded-full mx-auto">
                          {reply.author_avatar ? (
                            <img src={reply.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold text-xl">{reply.author_name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <p className="font-heading text-white text-sm mt-2 hover:text-primary">{reply.author_name}</p>
                      </Link>
                      <div className="ml-4 md:ml-0 md:mt-1">
                        {getRoleBadge(reply.author_role)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                        {reply.author_post_count || 0} posts
                      </p>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs text-muted-foreground">
                          #{index + 1} • {new Date(reply.created_at).toLocaleString()}
                        </p>
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
                  </div>
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
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link> to reply
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
