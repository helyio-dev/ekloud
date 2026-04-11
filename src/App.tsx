import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// imports des contextes et utilitaires globaux
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import KloudyAssistant from '@/components/KloudyAssistant';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';

// imports des pages utilisateur
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
import SettingsPage from '@/app/settings/page';
import PublicProfilePage from '@/app/u/[username]/page';
import AuthCallbackPage from '@/app/auth/callback/page';
import ClanQuizPage from '@/app/clan-quiz/page';
import SupportPage from '@/app/support/page';
import TermsPage from '@/app/terms/page';
import CreditsPage from '@/app/credits/page';

// imports des pages administration
import AdminDashboard from '@/app/admin/page';
import CreateModulePage from '@/app/admin/modules/new/page';
import CreateLessonPage from '@/app/admin/lessons/new/page';
import CreateQuizPage from '@/app/admin/quizzes/new/page';
import EditModulePage from '@/app/admin/modules/[id]/edit/page';
import ModuleContentPage from '@/app/admin/modules/[id]/content/page';
import EditLessonPage from '@/app/admin/lessons/[id]/edit/page';
import EditQuestionPage from '@/app/admin/quizzes/[id]/edit/page';
import SkillExamQuestionsPage from '@/app/admin/skills/[id]/exam/page';

const AppContent = () => {
    // vérification de l'état d'authentification pour la protection des routes
    const { isLoading, user } = useAuth();

    // affichage de l'écran de chargement initial
    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-700 delay-300 fill-mode-both">
                <div className="flex-grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
                        <p className="text-text-muted animate-pulse font-medium tracking-wide">initialisation du système...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <ScrollToTop />
            <main className="flex-grow">
                <Routes>
                    {/* routes publiques */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/credits" element={<CreditsPage />} />
                    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                    <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />

                    {/* routes utilisateur protégées */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                    <Route path="/modules/:id" element={<ProtectedRoute><ModulePage /></ProtectedRoute>} />
                    <Route path="/lessons/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
                    <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                    <Route path="/exam/:id" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
                    <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/clan-quiz" element={<ProtectedRoute><ClanQuizPage /></ProtectedRoute>} />
                    <Route path="/u/:username" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
                    <Route path="/account" element={<Navigate to="/settings" replace />} />

                    {/* routes administration */}
                    <Route path="/admin" element={<ProtectedRoute roles={['admin', 'contributor']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/modules/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateModulePage /></ProtectedRoute>} />
                    <Route path="/admin/modules/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditModulePage /></ProtectedRoute>} />
                    <Route path="/admin/modules/:id/content" element={<ProtectedRoute roles={['admin', 'contributor']}><ModuleContentPage /></ProtectedRoute>} />
                    <Route path="/admin/lessons/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateLessonPage /></ProtectedRoute>} />
                    <Route path="/admin/lessons/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditLessonPage /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/new" element={<ProtectedRoute roles={['admin', 'contributor']}><CreateQuizPage /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute roles={['admin', 'contributor']}><EditQuestionPage /></ProtectedRoute>} />
                    <Route path="/admin/skills/:id/exam" element={<ProtectedRoute roles={['admin']}><SkillExamQuestionsPage /></ProtectedRoute>} />

                    {/* redirection par défaut */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <KloudyAssistant />
        </div>
    );
};

// point d'entrée applicatif avec providers
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
