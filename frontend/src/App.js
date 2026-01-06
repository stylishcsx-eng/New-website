import '@/App.css';
import '@/index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { ServerStatus } from './pages/ServerStatus';
import { Rankings } from './pages/Rankings';
import { Banlist } from './pages/Banlist';
import { Rules } from './pages/Rules';
import { ApplyAdmin } from './pages/ApplyAdmin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { AdminPanel } from './pages/AdminPanel';
import { AdminLogin } from './pages/AdminLogin';
import { Team } from './pages/Team';
import { Forum, ForumCategory, ForumTopic } from './pages/Forum';
import { PlayerProfile } from './pages/PlayerProfile';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/server-status" element={<ServerStatus />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/banlist" element={<Banlist />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/apply-admin" element={<ApplyAdmin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/team" element={<Team />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/category/:categoryId" element={<ForumCategory />} />
            <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
            <Route path="/profile/:userId" element={<PlayerProfile />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster position="top-right" theme="dark" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
