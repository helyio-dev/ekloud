import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import WeeklyCompetition from '../WeeklyCompetition';

type SquadId = 'ROOT' | 'VOID' | 'CORE' | 'CYPHER';
const SQUAD_COLORS: Record<SquadId, { color: string; hex: string }> = {
    ROOT:   { color: 'text-orange-400', hex: '#fb923c' },
    VOID:   { color: 'text-violet-400', hex: '#a78bfa' },
    CORE:   { color: 'text-blue-400',   hex: '#60a5fa' },
    CYPHER: { color: 'text-green-400',  hex: '#4ade80' },
};

export default function MonthlyPage() {
    const { user, clan, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
        if (!authLoading && user && !clan) navigate('/clan-quiz');
    }, [user, clan, authLoading, navigate]);
    if (!clan) return null;
    const conf = SQUAD_COLORS[clan as SquadId] || SQUAD_COLORS.ROOT;
    return (
        <div className="min-h-screen bg-background text-text font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20" style={{ backgroundColor: conf.hex }} />
            <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
                <Link to="/clan-quiz" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors mb-8">
                    <ChevronLeft className="w-4 h-4" /> TechSquad
                </Link>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Championnat Mensuel</h1>
                        <p className={`text-sm font-bold ${conf.color}`}>{clan} · Cumul des 4 semaines</p>
                    </div>
                </div>
                <WeeklyCompetition userClan={clan as SquadId} defaultTab="month" />
            </div>
        </div>
    );
}
