import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import LandingPage from '@/app/page';
import Dashboard from '@/app/dashboard/page';
import FriendsPage from '@/app/friends/page';
import LeaderboardPage from '@/app/leaderboard/page';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';
import ModulePage from '@/app/modules/[id]/page';
import LessonPage from '@/app/lessons/[id]/page';
import QuizPage from '@/app/quiz/[id]/page';


import AuthCallbackPage from '@/app/auth/callback/page';
import AdminDashboard from '@/app/admin/page';
import CreateModulePage from '@/app/admin/modules/new/page';
import CreateLessonPage from '@/app/admin/lessons/new/page';
import CreateQuizPage from '@/app/admin/quizzes/new/page';
import ClanQuizPage from '@/app/clan-quiz/page';

const AppContent = () => {
    const { isLoading, user } = useAuth();

    
    
    
    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-700 delay-300 fill-mode-both">
                <div className="flex-grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
                        <p className="text-text-muted animate-pulse font-medium tracking-wide">Initialisation du système...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                    <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/modules/:id" element={<ModulePage />} />
                    <Route path="/lessons/:id" element={<LessonPage />} />
                    <Route path="/quiz/:id" element={<QuizPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/modules/new" element={<CreateModulePage />} />
                    <Route path="/admin/lessons/new" element={<CreateLessonPage />} />
                    <Route path="/admin/quizzes/new" element={<CreateQuizPage />} />
                    <Route path="/clan-quiz" element={<ClanQuizPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
