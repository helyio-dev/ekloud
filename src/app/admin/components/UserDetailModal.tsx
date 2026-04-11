import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    X, Shield, User, Trash2, RefreshCw, Mail, Loader2, BookOpen, 
    FileText, Target, AlertTriangle, Fingerprint, Activity, Zap, 
    ChevronRight, Key, Trash, History, ExternalLink, UserCircle
} from 'lucide-react';
import type { AdminUser } from './UserManagementTab';

/**
 * métriques de performance et d'engagement de l'utilisateur.
 */
type UserStats = {
    modulesCompleted: number;
    lessonsCompleted: number;
    quizAttempts: number;
};

interface Props {
    user: AdminUser;
    onClose: () => void;
    onUserUpdated: (updated: Partial<AdminUser> & { id: string }) => void;
    onUserDeleted: (id: string) => void;
}

/**
 * tiroir latéral d'inspection et de gestion des identités.
 * implémente une vue chirurgicale des données utilisateur avec commandes d'administration avancées.
 */
export default function UserDetailModal({ user, onClose, onUserUpdated, onUserDeleted }: Props) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    /**
     * agrégation des indicateurs de progression via le moteur supalytics.
     */
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const [{ count: modulesCompleted }, { count: lessonsCompleted }, { count: quizAttempts }] = await Promise.all([
                supabase.from('user_modules').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
                supabase.from('user_lessons').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
                supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            ]);
            setStats({ 
                modulesCompleted: modulesCompleted ?? 0, 
                lessonsCompleted: lessonsCompleted ?? 0, 
                quizAttempts: quizAttempts ?? 0 
            });
        } catch (err) {
            console.error('UserDetailModal: échec synchronisation analytics:', err);
        } finally {
            setLoadingStats(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const showFeedback = (type: 'success' | 'error', msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    /**
     * mutation du privilège d'accès au niveau base de données.
     */
    const handleRoleChange = async (newRole: string) => {
        if (newRole === user.role) return;
        setIsActionLoading(`role-${newRole}`);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);
            if (error) throw error;
            onUserUpdated({ id: user.id, role: newRole });
            showFeedback('success', `privilège muté en "${newRole}".`);
        } catch (err: any) {
            showFeedback('error', err.message || 'échec de mutation du rôle.');
        } finally {
            setIsActionLoading(null);
        }
    };

    /**
     * purge de la pile de progression et réinitialisation des index d'expérience.
     */
    const handleResetProgress = async () => {
        setIsActionLoading('reset');
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ xp: 0, level: 1, streak: 0 })
                .eq('id', user.id);
            if (profileError) throw profileError;

            const [{ error: modError }, { error: lesError }] = await Promise.all([
                supabase.from('user_modules').delete().eq('user_id', user.id),
                supabase.from('user_lessons').delete().eq('user_id', user.id),
            ]);
            if (modError) throw modError;
            if (lesError) throw lesError;

            onUserUpdated({ id: user.id, xp: 0, level: 1, streak: 0 });
            setStats(s => s ? { ...s, modulesCompleted: 0, lessonsCompleted: 0 } : s);
            showFeedback('success', 'pipeline de progression réinitialisé.');
        } catch (err: any) {
            showFeedback('error', err.message || 'échec de la purge de progression.');
        } finally {
            setIsActionLoading(null);
            setConfirm(null);
        }
    };

    /**
     * déclenchement du flux d'authentification pour récupération sécurisée des accès.
     */
    const handlePasswordReset = async () => {
        setIsActionLoading('password');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback`,
            });
            if (error) throw error;
            showFeedback('success', `vecteur de récupération transmis à ${user.email}.`);
        } catch (err: any) {
            showFeedback('error', err.message || 'échec d\'émission du signal de récupération.');
        } finally {
            setIsActionLoading(null);
        }
    };

    /**
     * exécution de la procédure de suppression définitive (hard delete).
     */
    const handleDelete = async () => {
        setIsActionLoading('delete');
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
            if (error) throw error;
            onUserDeleted(user.id);
        } catch (err: any) {
            showFeedback('error', err.message || 'blocage protocole de suppression (rls active?).');
            setIsActionLoading(null);
            setConfirm(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden">
            <div className="absolute inset-0 bg-background/20 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative w-full max-w-xl h-full bg-surface/40 backdrop-blur-3xl border-l border-border/60 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                {/* en-tête immersif */}
                <header className="p-10 pb-12 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none rotate-12">
                        <Activity size={300} />
                    </div>
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-accent to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-xl"></div>
                                <div className="w-24 h-24 rounded-full border-2 border-accent/20 bg-background flex items-center justify-center text-accent relative z-10 overflow-hidden">
                                    <span className="text-3xl font-black">{ (user.username ?? user.email ?? '?').charAt(0).toUpperCase() }</span>
                                    <div className="absolute bottom-0 inset-x-0 h-1/3 bg-accent/10 backdrop-blur-md flex items-center justify-center">
                                        <UserCircle size={12} className="opacity-40" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-text uppercase tracking-tighter">{ user.username ?? 'anonyme' }</h2>
                                <div className="flex items-center gap-2 group/email cursor-pointer">
                                    <Mail size={12} className="text-text-muted/40 group-hover/email:text-accent transition-colors" />
                                    <p className="text-xs text-text-muted font-bold group-hover/email:text-text transition-colors italic">{ user.email }</p>
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={onClose} className="p-4 bg-background/40 hover:bg-rose-500/10 rounded-2xl transition-all text-text-muted hover:text-rose-500 border border-border/40 active:scale-90">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 pb-20 custom-scrollbar space-y-12">
                    {feedback && (
                        <div className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 ml-1">
                            <Zap size={14} className="text-accent" />
                            <h3 className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">index de performance</h3>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard label="score xp" value={user.xp.toLocaleString()} icon={<Fingerprint className="text-accent" />} />
                            <StatCard label="grade" value={`v${user.level}`} icon={<Activity className="text-purple-400" />} />
                            <StatCard label="fusion" value={`${user.streak} j`} icon={<History className="text-orange-400" />} />
                        </div>

                        {loadingStats ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 text-accent animate-spin opacity-20" />
                            </div>
                        ) : stats && (
                            <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-700">
                                <DeepStat label="modules valides" value={stats.modulesCompleted} variant="blue" />
                                <DeepStat label="leçons lues" value={stats.lessonsCompleted} variant="emerald" />
                                <DeepStat label="essais quiz" value={stats.quizAttempts} variant="amber" />
                            </div>
                        )}
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 ml-1">
                            <Shield size={14} className="text-accent" />
                            <h3 className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">configuration système</h3>
                        </div>
                        
                        <div className="bg-background/20 border border-border/40 rounded-[2.5rem] p-8 space-y-6">
                            <MetaRow label="privilège d'accès" value={
                                user.role === 'admin'
                                    ? <span className="text-accent font-black flex items-center gap-2 uppercase tracking-widest text-[10px] bg-accent/10 px-3 py-1 rounded-full"><Shield className="w-3 h-3" /> administrateur</span>
                                    : user.role === 'contributor'
                                    ? <span className="text-purple-400 font-black flex items-center gap-2 uppercase tracking-widest text-[10px] bg-purple-400/10 px-3 py-1 rounded-full"><BookOpen className="w-3 h-3" /> contributeur</span>
                                    : <span className="text-text-muted/40 font-black flex items-center gap-2 uppercase tracking-widest text-[10px] bg-background/60 px-3 py-1 rounded-full"><User className="w-3 h-3" /> étudiant</span>
                            } />
                            <MetaRow label="chronogramme d'inscription" value={new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} />
                            <MetaRow label="id unique (uuid)" value={user.id.substring(0, 18) + '...'} />
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 ml-1">
                            <Target size={14} className="text-accent" />
                            <h3 className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">centre d'opérations</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex bg-background/20 border border-border/40 p-2 rounded-[2rem]">
                                {(['student', 'contributor', 'admin'] as const).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleChange(role)}
                                        disabled={user.role === role || (isActionLoading !== null && isActionLoading.startsWith('role'))}
                                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${user.role === role ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text hover:bg-background/40'} disabled:opacity-30`}
                                    >
                                        {role === 'admin' ? <Shield size={16} /> : role === 'contributor' ? <BookOpen size={16} /> : <User size={16} />}
                                        {role === 'student' ? 'étudiant' : role}
                                    </button>
                                ))}
                            </div>

                            <AdminAction
                                icon={<Key size={16} />}
                                label="réinitialiser les accès"
                                description="envoie un lien de récupération par email"
                                loading={isActionLoading === 'password'}
                                onClick={handlePasswordReset}
                                variant="nebula"
                            />

                            {confirm === 'reset' ? (
                                <ActionConfirm
                                    message="purger la progression et l'xp ?"
                                    onConfirm={handleResetProgress}
                                    onCancel={() => setConfirm(null)}
                                    loading={isActionLoading === 'reset'}
                                    variant="warning"
                                />
                            ) : (
                                <AdminAction
                                    icon={<RefreshCw size={16} />}
                                    label="purger la progression"
                                    description="réinitialise l'xp et les modules validés"
                                    onClick={() => setConfirm('reset')}
                                    variant="warning"
                                />
                            )}

                            {confirm === 'delete' ? (
                                <ActionConfirm
                                    message="supprimer définitivement l'identité ?"
                                    onConfirm={handleDelete}
                                    onCancel={() => setConfirm(null)}
                                    loading={isActionLoading === 'delete'}
                                    variant="danger"
                                />
                            ) : (
                                <AdminAction
                                    icon={<Trash size={16} />}
                                    label="supprimer le profil"
                                    description="action irréversible sur la base de données"
                                    onClick={() => setConfirm('delete')}
                                    variant="danger"
                                />
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <div className="bg-background/20 border border-border/40 rounded-[1.8rem] p-6 group hover:border-accent/40 transition-all duration-500">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-background border border-border/60 rounded-xl group-hover:scale-110 transition-transform">{ icon }</div>
        </div>
        <p className="text-2xl font-black text-text uppercase tracking-tighter mb-1">{ value }</p>
        <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest">{ label }</p>
    </div>
);

const DeepStat = ({ label, value, variant }: { label: string; value: number; variant: 'blue' | 'emerald' | 'amber' }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/5 border-blue-400/20',
        emerald: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20',
        amber: 'text-amber-400 bg-amber-400/5 border-amber-400/20'
    };
    return (
        <div className={`p-5 rounded-[1.5rem] border ${colors[variant]} space-y-1`}>
            <p className="text-xl font-black">{ value }</p>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-tight">{ label }</p>
        </div>
    );
};

const MetaRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-10">
        <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">{ label }</span>
        <div className="text-xs font-bold text-text-muted/80">{ value }</div>
    </div>
);

const AdminAction = ({ icon, label, description, loading, onClick, variant }: any) => {
    const styles = {
        nebula: 'border-border/40 hover:border-accent/40 hover:bg-accent/5 text-text',
        warning: 'border-orange-500/20 hover:border-orange-500/60 hover:bg-orange-500/5 text-orange-400',
        danger: 'border-rose-500/20 hover:border-rose-500/60 hover:bg-rose-500/5 text-rose-500'
    };
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`group w-full flex items-center gap-6 p-6 bg-background/20 border rounded-[2rem] transition-all text-left disabled:opacity-30 ${styles[variant as keyof typeof styles]}`}
        >
            <div className="shrink-0 p-3 bg-background border border-border/40 rounded-2xl group-hover:scale-110 transition-transform">
                { loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon }
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest mb-1">{ label }</p>
                <p className="text-[10px] font-bold text-text-muted/40 italic leading-none">{ description }</p>
            </div>
            <ChevronRight size={14} className="opacity-10 group-hover:opacity-40 group-hover:translate-x-1 transition-all" />
        </button>
    );
};

const ActionConfirm = ({ message, onConfirm, onCancel, loading, variant }: any) => (
    <div className={`p-8 rounded-[2rem] border animate-in slide-in-from-bottom-4 ${variant === 'danger' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
        <div className="flex items-start gap-4 mb-8">
            <AlertTriangle className={`w-6 h-6 shrink-0 ${variant === 'danger' ? 'text-rose-500' : 'text-orange-400'}`} />
            <p className="text-xs font-black uppercase tracking-widest leading-relaxed mt-1">{ message }</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <button onClick={onCancel} disabled={loading} className="py-4 bg-background/40 border border-border/40 text-text rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-surface active:scale-95">annuler</button>
            <button onClick={onConfirm} disabled={loading} className={`py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-rose-600 shadow-lg shadow-rose-600/20' : 'bg-orange-500 shadow-lg shadow-orange-500/20'}`}>
                { loading && <Loader2 className="w-3 h-3 animate-spin" /> } confimer
            </button>
        </div>
    </div>
);
