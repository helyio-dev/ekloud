import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock as LockIcon, Loader2, Award, ChevronRight } from 'lucide-react';

type Module = {
    id: string;
    title: string;
    description: string;
    category: string;
    order_index: number;
    prerequisite_id?: string | null;
};

type UserModule = {
    module_id: string;
    unlocked: boolean;
    completed: boolean;
};

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [userModules, setUserModules] = useState<Record<string, UserModule>>({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setIsLoading(true);
            try {
                const [
                    { data: modData },
                    { data: userModData }
                ] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('*').eq('user_id', user.id)
                ]);

                setModules(modData || []);
                const userModMap: Record<string, UserModule> = {};
                userModData?.forEach(um => { userModMap[um.module_id] = um; });
                setUserModules(userModMap);
            } catch (err) {
                console.error("Courses fetchData error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading && user) fetchData();

        // Realtime subscription for instant updates
        const channel = supabase
            .channel('courses-updates')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'user_modules', 
                filter: `user_id=eq.${user?.id}` 
            }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, authLoading]);

    return (
        <div className="min-h-screen bg-background text-text p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-black mb-2">TOUS LES COURS</h1>
                    <p className="text-text-muted text-lg text-balance">Explorez notre catalogue complet de modules et progressez à votre rythme.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {modules.map((mod, index) => {
                            const userMod = userModules[mod.id];
                            const isUnlocked = userMod?.unlocked || !mod.prerequisite_id;
                            const isCompleted = userMod?.completed;

                            return (
                                <Link
                                    key={mod.id}
                                    to={isUnlocked ? `/modules/${mod.id}` : '#'}
                                    className={`group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col ${isUnlocked
                                            ? 'bg-surface/50 border-white/5 hover:border-accent/40 hover:bg-surface'
                                            : 'bg-surface/20 border-white/5 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl bg-background border border-white/5 ${isUnlocked ? 'text-accent' : 'text-text-muted'}`}>
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        {isCompleted && (
                                            <div className="flex items-center gap-1.5 text-green-400 text-[10px] font-black bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 uppercase tracking-wider">
                                                <CheckCircle className="w-3 h-3" />
                                                Complété
                                            </div>
                                        )}
                                        {!isUnlocked && <LockIcon className="w-5 h-5 text-text-muted" />}
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{mod.title}</h3>
                                    <p className="text-text-muted text-sm mb-8 line-clamp-2 flex-grow">{mod.description}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                            {mod.category || 'Général'}
                                        </span>
                                        {isUnlocked && (
                                            <div className="flex items-center gap-1 text-accent font-bold text-sm">
                                                Voir le cours
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {!isLoading && modules.length === 0 && (
                    <div className="text-center py-20 bg-surface/20 rounded-3xl border border-dashed border-white/10">
                        <Award className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted italic">Aucun cours disponible pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
