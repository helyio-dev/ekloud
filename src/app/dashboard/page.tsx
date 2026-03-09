import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock as LockIcon, Layout, LogOut, Loader2, Award } from 'lucide-react';

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

export default function Dashboard() {
    const { user, isLoading: authLoading, signOut } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [userModules, setUserModules] = useState<Record<string, UserModule>>({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            
            if (modules.length === 0) {
                setIsLoading(true);
            }
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
                userModData?.forEach(um => {
                    userModMap[um.module_id] = um;
                });
                setUserModules(userModMap);
            } catch (err) {
                console.error("Dashboard fetchData error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading) {
            fetchData();
        }
    }, [user?.id, authLoading]);

    return (
        <div className="min-h-screen bg-background text-text">
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold mb-2">Bienvenue sur votre parcours</h1>
                    <p className="text-text-muted mb-8">Progressez module après module pour maîtriser les technologies.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {modules.map((mod, index) => {
                            const userMod = userModules[mod.id];
                            const prerequisite_id = mod.prerequisite_id;
                            let isUnlocked = userMod?.unlocked || false;

                            
                            if (prerequisite_id) {
                                const prereqMod = userModules[prerequisite_id];
                                if (prereqMod?.completed) {
                                    isUnlocked = true;
                                } else {
                                    isUnlocked = false;
                                }
                            } else if (index === 0) {
                                
                                isUnlocked = true;
                            }

                            const isCompleted = userMod?.completed;

                            return (
                                <div
                                    key={mod.id}
                                    style={{ animationDelay: `${index * 150}ms` }}
                                    className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden animate-in slide-up hover-glow ${isUnlocked
                                        ? 'bg-surface/50 border-white/5 group'
                                        : 'bg-surface/20 border-white/5 opacity-80'
                                        }`}
                                >
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                                            <div className="bg-surface/80 p-3 rounded-full border border-white/10 flex flex-col items-center">
                                                <LockIcon className="w-6 h-6 text-text-muted mb-2" />
                                                {prerequisite_id && (
                                                    <span className="text-xs text-text-muted text-center max-w-[200px]">
                                                        Nécessite le module précédent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-background border border-white/5 text-accent">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        {isCompleted && (
                                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-full">
                                                <CheckCircle className="w-3 h-3" />
                                                COMPLÉTÉ
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{mod.title}</h3>
                                    <p className="text-text-muted text-sm mb-6 line-clamp-2">{mod.description}</p>

                                    {isUnlocked ? (
                                        <Link
                                            to={`/modules/${mod.id}`}
                                            className="w-full py-2 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-lg text-sm font-semibold transition-all inline-block text-center border border-accent/20"
                                        >
                                            Continuer
                                        </Link>
                                    ) : (
                                        <div className="w-full py-2 bg-white/5 text-text-muted rounded-lg text-sm font-semibold text-center border border-white/5">
                                            Verrouillé
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && modules.length === 0 && (
                    <div className="text-center py-20 bg-surface/20 rounded-3xl border border-dashed border-white/10">
                        <Award className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted italic">Aucun module n'est disponible pour le moment. L'aventure commence bientôt !</p>
                    </div>
                )}
            </main>
        </div>
    );
}
