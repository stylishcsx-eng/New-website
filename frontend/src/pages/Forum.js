import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Chatbox } from '../components/Chatbox';
import { 
  MessageSquare, Plus, Pin, Lock, MessageCircle, Trash2, User, Clock, 
  Eye, Megaphone, HelpCircle, Scale, Coffee, ChevronRight, ArrowLeft,
  Settings, FolderPlus, Edit, Users, Bug, Shield, AlertTriangle, Tag,
  CheckCircle, XCircle, Archive, Bell, Image, Film, X
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
  Users: Users,
  Bug: Bug,
  Shield: Shield,
  AlertTriangle: AlertTriangle
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format post count
const formatCount = (count) => {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count;
};

// Main Forum Page with Categories - LSGAMERS Style
export const Forum = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewSection, setShowNewSection] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [newSection, setNewSection] = useState({ name: '', description: '', icon: 'MessageSquare', order: 0 });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'MessageSquare', tags: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/forum/sections`);
      setSections(res.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      // Fallback to old categories API
      try {
        const catRes = await axios.get(`${API}/forum/categories`);
        setSections([{ id: 'default', name: 'Community', categories: catRes.data }]);
      } catch (e) {
        console.error('Failed to fetch categories', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/forum/sections`, newSection);
      setNewSection({ name: '', description: '', icon: 'MessageSquare', order: 0 });
      setShowNewSection(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create section', error);
      alert(error.response?.data?.detail || 'Failed to create section');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const tags = newCategory.tags.split(',').map(t => t.trim()).filter(t => t);
      await axios.post(`${API}/forum/categories`, {
        ...newCategory,
        section_id: selectedSection,
        tags: tags
      });
      setNewCategory({ name: '', description: '', icon: 'MessageSquare', tags: '' });
      setShowNewCategory(false);
      setSelectedSection(null);
      fetchData();
    } catch (error) {
      console.error('Failed to create category', error);
      alert(error.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section and ALL its categories/topics? This cannot be undone!')) return;
    try {
      await axios.delete(`${API}/forum/sections/${sectionId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete section', error);
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
                  Join the community discussion!
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewSection(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all font-heading uppercase text-sm tracking-wider"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Section</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin: New Section Form */}
        {showNewSection && isAdmin && (
          <div className="bg-card/50 border border-green-500/50 p-6 mb-6">
            <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-green-500" />
              <span>CREATE NEW SECTION</span>
            </h3>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Section Name</label>
                  <input
                    type="text"
                    value={newSection.name}
                    onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="e.g., Report Section, Community"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Order</label>
                  <input
                    type="number"
                    value={newSection.order}
                    onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="px-6 py-3 bg-green-500 text-white font-heading uppercase text-sm tracking-wider hover:bg-green-600 transition-colors">
                  Create Section
                </button>
                <button type="button" onClick={() => setShowNewSection(false)} className="px-6 py-3 border border-white/20 text-white font-heading uppercase text-sm tracking-wider hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin: New Category Form */}
        {showNewCategory && isAdmin && (
          <div className="bg-card/50 border border-primary/50 p-6 mb-6">
            <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>ADD CATEGORY TO SECTION</span>
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                    placeholder="e.g., Report Cheaters, General Discussion"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  >
                    <option value="MessageSquare">💬 Message</option>
                    <option value="Megaphone">📢 Megaphone</option>
                    <option value="HelpCircle">❓ Help</option>
                    <option value="Bug">🐛 Bug</option>
                    <option value="Shield">🛡️ Shield</option>
                    <option value="AlertTriangle">⚠️ Alert</option>
                    <option value="Users">👥 Users</option>
                    <option value="Coffee">☕ Coffee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="Brief description of this category"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Status Tags (comma separated)</label>
                <input
                  type="text"
                  value={newCategory.tags}
                  onChange={(e) => setNewCategory({ ...newCategory, tags: e.target.value })}
                  className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="e.g., Not Banned, Banned, Gags OR Resolved, Unresolved"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty if no status tags needed</p>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="px-6 py-3 bg-primary text-white font-heading uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors">
                  Create Category
                </button>
                <button type="button" onClick={() => { setShowNewCategory(false); setSelectedSection(null); }} className="px-6 py-3 border border-white/20 text-white font-heading uppercase text-sm tracking-wider hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Forum Sections */}
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-card/30 border border-white/10">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-heading uppercase">No forum sections yet</p>
            {isAdmin && <p className="text-sm text-muted-foreground mt-2">Create a section to get started!</p>}
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <div className="flex items-center justify-between bg-card/80 border border-white/10 px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-primary font-heading text-lg uppercase tracking-wider">
                      -{section.name.substring(0, 2).toUpperCase()}- {section.name}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setSelectedSection(section.id); setShowNewCategory(true); }}
                        className="p-1.5 text-green-500 hover:bg-green-500/20 transition-colors"
                        title="Add Category"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Categories in Section */}
                {section.categories && section.categories.length > 0 ? (
                  section.categories.map((category) => {
                    const IconComponent = iconMap[category.icon] || MessageSquare;
                    return (
                      <div 
                        key={category.id}
                        className="bg-card/30 border border-white/5 hover:border-primary/30 transition-all"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Left: Icon, Title, Description, Tags */}
                          <div className="flex-1 p-4 md:p-6">
                            <div className="flex items-start space-x-4">
                              {/* Logo/Icon */}
                              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-6 h-6 text-primary" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/forum/category/${category.id}`}
                                  className="group"
                                >
                                  <h3 className="font-heading text-lg text-white group-hover:text-primary transition-colors">
                                    {category.name}
                                  </h3>
                                </Link>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {category.description}
                                </p>
                                
                                {/* Status Tags */}
                                {category.tags && category.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {category.tags.map((tag, idx) => (
                                      <span 
                                        key={idx}
                                        className="flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary text-xs"
                                      >
                                        <Tag className="w-3 h-3" />
                                        <span>{tag}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Admin Controls */}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="mt-2 text-red-500 hover:text-red-400 text-xs flex items-center space-x-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Post Count & Last Activity */}
                          <div className="flex md:flex-col items-center justify-between md:justify-center md:w-48 p-4 border-t md:border-t-0 md:border-l border-white/5 bg-black/20">
                            <div className="text-center mb-0 md:mb-4">
                              <span className="text-2xl md:text-3xl font-bold text-primary">
                                {formatCount(category.post_count || 0)}
                              </span>
                              <p className="text-xs text-muted-foreground uppercase">Posts</p>
                            </div>
                            
                            {category.last_post ? (
                              <div className="text-right md:text-center">
                                <Link 
                                  to={`/forum/topic/${category.last_post.topic_id}`}
                                  className="text-sm text-white hover:text-primary truncate block max-w-[150px]"
                                >
                                  {category.last_post.topic_title}
                                </Link>
                                <div className="text-xs text-muted-foreground mt-1">
                                  By <span className="text-primary">{category.last_post.author}</span>
                                  <br />
                                  {formatRelativeTime(category.last_post.date)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No posts yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-card/30 border border-white/5 p-8 text-center">
                    <p className="text-muted-foreground text-sm">No categories in this section yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Chatbox */}
      <Chatbox />
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
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tag: '', media_urls: [] });
  const [mediaInput, setMediaInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterTag, setFilterTag] = useState('all');

  // Helper to detect media type
  const getMediaType = (url) => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/)) return 'video';
    if (lower.match(/\.(gif)(\?.*)?$/)) return 'gif';
    if (lower.match(/\.(jpg|jpeg|png|webp|bmp)(\?.*)?$/)) return 'image';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('imgur.com') || lower.includes('gyazo.com') || lower.includes('prnt.sc')) return 'image';
    return 'image'; // default to image
  };

  const addMediaUrl = () => {
    if (mediaInput.trim() && newTopic.media_urls.length < 5) {
      setNewTopic({
        ...newTopic,
        media_urls: [...newTopic.media_urls, mediaInput.trim()]
      });
      setMediaInput('');
    }
  };

  const removeMediaUrl = (index) => {
    setNewTopic({
      ...newTopic,
      media_urls: newTopic.media_urls.filter((_, i) => i !== index)
    });
  };

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
        content: newTopic.content,
        tag: newTopic.tag || null,
        media_urls: newTopic.media_urls
      });
      setNewTopic({ title: '', content: '', tag: '', media_urls: [] });
      setMediaInput('');
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

  const handleUpdateTopicTag = async (topicId, newTag) => {
    try {
      await axios.patch(`${API}/forum/topics/${topicId}/tag`, { tag: newTag });
      fetchData();
    } catch (error) {
      console.error('Failed to update tag', error);
    }
  };

  // Filter topics by tag
  const filteredTopics = filterTag === 'all' 
    ? topics 
    : topics.filter(t => t.tag === filterTag);

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
          
          {/* Tag Filters */}
          {category.tags && category.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setFilterTag('all')}
                className={`px-3 py-1.5 text-xs font-heading uppercase transition-all ${
                  filterTag === 'all' ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:text-white'
                }`}
              >
                All Topics
              </button>
              {category.tags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilterTag(tag)}
                  className={`px-3 py-1.5 text-xs font-heading uppercase transition-all flex items-center space-x-1 ${
                    filterTag === tag ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:text-white'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* New Topic Form */}
        {showNewTopic && (
          <div className="bg-card/50 border border-primary/50 p-6 mb-6">
            <h3 className="font-heading text-xl font-bold text-white mb-4">CREATE NEW TOPIC</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
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
                {category.tags && category.tags.length > 0 && (
                  <div>
                    <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">Status Tag</label>
                    <select
                      value={newTopic.tag}
                      onChange={(e) => setNewTopic({ ...newTopic, tag: e.target.value })}
                      className="w-full bg-muted/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-primary"
                    >
                      <option value="">Select tag...</option>
                      {category.tags.map((tag, idx) => (
                        <option key={idx} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}
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
              
              {/* Media Attachments */}
              <div>
                <label className="block text-sm text-muted-foreground uppercase tracking-wider mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Attach Media (Images, GIFs, Videos)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={mediaInput}
                    onChange={(e) => setMediaInput(e.target.value)}
                    className="flex-1 bg-muted/50 border border-white/10 px-4 py-2 text-white outline-none focus:border-primary text-sm"
                    placeholder="Paste image/video URL (imgur, gyazo, youtube, etc.)"
                  />
                  <button
                    type="button"
                    onClick={addMediaUrl}
                    disabled={!mediaInput.trim() || newTopic.media_urls.length >= 5}
                    className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Max 5 attachments. Supports: JPG, PNG, GIF, MP4, WebM, YouTube</p>
                
                {/* Media Previews */}
                {newTopic.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newTopic.media_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className="w-20 h-20 bg-muted border border-white/10 overflow-hidden">
                          {getMediaType(url) === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/50">
                              <Film className="w-8 h-8 text-primary" />
                            </div>
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = ''} />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
        {filteredTopics.length === 0 ? (
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

            {filteredTopics.map((topic) => (
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
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                          {topic.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          {topic.tag && (
                            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary flex items-center space-x-1">
                              <Tag className="w-3 h-3" />
                              <span>{topic.tag}</span>
                            </span>
                          )}
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
                          <span>•</span>
                          <span>{formatRelativeTime(topic.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin/Mod Controls */}
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
                        {category.tags && category.tags.length > 0 && (
                          <select
                            value={topic.tag || ''}
                            onChange={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateTopicTag(topic.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 bg-muted/50 border border-white/10 px-2 py-1 text-xs text-white outline-none"
                          >
                            <option value="">No tag</option>
                            {category.tags.map((tag, idx) => (
                              <option key={idx} value={tag}>{tag}</option>
                            ))}
                          </select>
                        )}
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
  const [replyMediaUrls, setReplyMediaUrls] = useState([]);
  const [mediaInput, setMediaInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper to detect media type
  const getMediaType = (url) => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/)) return 'video';
    if (lower.match(/\.(gif)(\?.*)?$/)) return 'gif';
    if (lower.match(/\.(jpg|jpeg|png|webp|bmp)(\?.*)?$/)) return 'image';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    return 'image';
  };

  // Get YouTube embed URL
  const getYouTubeEmbed = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const addMediaUrl = () => {
    if (mediaInput.trim() && replyMediaUrls.length < 5) {
      setReplyMediaUrls([...replyMediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  const removeMediaUrl = (index) => {
    setReplyMediaUrls(replyMediaUrls.filter((_, i) => i !== index));
  };

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
        content: newReply,
        media_urls: replyMediaUrls
      });
      setNewReply('');
      setReplyMediaUrls([]);
      setMediaInput('');
      fetchData();
    } catch (error) {
      console.error('Failed to post reply', error);
      alert(error.response?.data?.detail || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Render media attachments
  const renderMedia = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-3">
        {mediaUrls.map((url, idx) => {
          const type = getMediaType(url);
          
          if (type === 'video') {
            return (
              <video 
                key={idx} 
                controls 
                className="max-w-full max-h-96 rounded border border-white/10"
                preload="metadata"
              >
                <source src={url} type="video/mp4" />
                Your browser does not support videos.
              </video>
            );
          }
          
          if (type === 'youtube') {
            const embedUrl = getYouTubeEmbed(url);
            if (embedUrl) {
              return (
                <div key={idx} className="relative w-full max-w-lg aspect-video">
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full rounded border border-white/10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
          }
          
          // Image or GIF
          return (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
              <img 
                src={url} 
                alt="Attachment" 
                className="max-w-full max-h-96 rounded border border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
                onError={(e) => e.target.style.display = 'none'}
              />
            </a>
          );
        })}
      </div>
    );
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
      moderator: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
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
          <div className="flex items-center space-x-3 flex-wrap">
            {topic.is_pinned && <Pin className="w-5 h-5 text-yellow-500" />}
            {topic.is_locked && <Lock className="w-5 h-5 text-red-500" />}
            {topic.tag && (
              <span className="px-2 py-1 text-xs bg-primary/20 text-primary flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>{topic.tag}</span>
              </span>
            )}
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
              {/* Topic Media */}
              {renderMedia(topic.media_urls)}
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
