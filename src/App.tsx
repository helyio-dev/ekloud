import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import KloudyAssistant from '@/components/KloudyAssistant';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/app/page';
import Dashboard from '@/app/dashboard/page';
import FriendsPage from '@/app/friends/page';
import LeaderboardPage from '@/app/leaderboard/page';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';
import ModulePage from '@/app/modules/[id]/page';
import LessonPage from '@/app/lessons/[id]/page';
import QuizPage from '@/app/quiz/[id]/page';
import ExamPage from '@/app/exam/[id]/page';
import CoursesPage from '@/app/courses/page';
import AccountPage from '@/app/account/page';
import SettingsPage from '@/app/settings/page';
import PublicProfilePage from '@/app/u/[username]/page';


import AuthCallbackPage from '@/app/auth/callback/page';
import AdminDashboard from '@/app/admin/page';
import CreateModulePage from '@/app/admin/modules/new/page';
import CreateLessonPage from '@/app/admin/lessons/new/page';
import CreateQuizPage from '@/app/admin/quizzes/new/page';
import EditModulePage from '@/app/admin/modules/[id]/edit/page';
import ModuleContentPage from '@/app/admin/modules/[id]/content/page';
import EditLessonPage from '@/app/admin/lessons/[id]/edit/page';
import EditQuestionPage from '@/app/admin/quizzes/[id]/edit/page';
import SkillExamQuestionsPage from '@/app/admin/skills/[id]/exam/page';
import ClanQuizPage from '@/app/clan-quiz/page';
import SupportPage from '@/app/support/page';

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
                    <Route path="/exam/:id" element={<ExamPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/account" element={<Navigate to="/settings" replace />} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute roles={['admin', 'contributor']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/modules/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateModulePage /></ProtectedRoute>} />
                    <Route path="/admin/modules/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditModulePage /></ProtectedRoute>} />
                    <Route path="/admin/modules/:id/content" element={<ProtectedRoute roles={['admin', 'contributor']}><ModuleContentPage /></ProtectedRoute>} />
                    <Route path="/admin/lessons/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateLessonPage /></ProtectedRoute>} />
                    <Route path="/admin/lessons/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditLessonPage /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateQuizPage /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditQuestionPage /></ProtectedRoute>} />
                    <Route path="/admin/skills/:id/exam" element={<ProtectedRoute roles={['admin']}><SkillExamQuestionsPage /></ProtectedRoute>} />
                    <Route path="/clan-quiz" element={<ClanQuizPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/u/:username" element={<PublicProfilePage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <KloudyAssistant />
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
