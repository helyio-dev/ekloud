import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    X, Shield, User, Trash2, RefreshCw, Mail, Loader2, BookOpen, 
    FileText, Target, AlertTriangle, Fingerprint, Activity, Zap, 
    ChevronRight, Key, Trash, History, ExternalLink, UserCircle, Sparkles, Flame
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
            <div className="absolute inset-0 bg-background/80" onClick={onClose} />

            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                {/* Slim Header */}
                <header className="p-8 border-b border-border/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center text-accent font-black text-xl shadow-inner">
                            { (user.username ?? user.email ?? '?').charAt(0).toUpperCase() }
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{ user.username ?? 'Anonyme' }</h2>
                            <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-60">{ user.email }</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-background border border-border rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                    {feedback && (
                        <div className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${feedback.type === 'success' ? 'bg-accent/5 text-accent border-accent/20' : 'bg-rose-500/5 text-rose-500 border-rose-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}

                    {/* Performance Stats */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                            <Zap size={14} className="text-accent" /> Statistiques Générales
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard label="XP" value={user.xp.toLocaleString()} />
                            <StatCard label="NIVEAU" value={user.level.toString()} />
                            <StatCard label="SÉRIE" value={`${user.streak}J`} />
                        </div>
                    </div>

                    {/* Roles Control */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                            <Shield size={14} className="text-accent" /> Rôle de l'Utilisateur
                        </h3>
                        <div className="flex bg-background border border-border p-2 rounded-xl">
                            {(['student', 'contributor', 'admin'] as const).map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleChange(role)}
                                    disabled={user.role === role || (isActionLoading !== null && isActionLoading.startsWith('role'))}
                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${user.role === role ? 'bg-accent text-white' : 'text-text-muted hover:text-text hover:bg-surface'} disabled:opacity-30`}
                                >
                                    {role === 'admin' ? 'Admin' : role === 'contributor' ? 'Contrib.' : 'Étudiant'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Critical Actions */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                            <Target size={14} className="text-accent" /> Opérations Critiques
                        </h3>
                        <div className="space-y-3">
                            <AdminAction
                                label="Réinitialisation MDP"
                                description="Envoyer un lien de reset par email"
                                loading={isActionLoading === 'password'}
                                onClick={handlePasswordReset}
                            />
                            
                            {confirm === 'reset' ? (
                                <ActionConfirm
                                    message="Confirmer la réinitialisation ?"
                                    onConfirm={handleResetProgress}
                                    onCancel={() => setConfirm(null)}
                                    loading={isActionLoading === 'reset'}
                                    variant="warning"
                                />
                            ) : (
                                <AdminAction
                                    label="Reset Progress"
                                    description="Réinitialiser XP et modules"
                                    onClick={() => setConfirm('reset')}
                                    variant="warning"
                                />
                            )}

                            {confirm === 'delete' ? (
                                <ActionConfirm
                                    message="Confirmer la suppression ?"
                                    onConfirm={handleDelete}
                                    onCancel={() => setConfirm(null)}
                                    loading={isActionLoading === 'delete'}
                                    variant="danger"
                                />
                            ) : (
                                <AdminAction
                                    label="Détruire le Profil"
                                    description="Action irréversible sur l'identité"
                                    onClick={() => setConfirm('delete')}
                                    variant="danger"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <p className="text-lg font-black">{ value }</p>
        <p className="text-[8px] font-black text-text-muted/60 uppercase tracking-widest">{ label }</p>
    </div>
);

const DeepStat = ({ label, value, variant }: { label: string; value: number; variant: 'blue' | 'emerald' | 'amber' }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/5 border-blue-400/20',
        emerald: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20',
        amber: 'text-amber-400 bg-amber-400/5 border-amber-400/20'
    };
    return (
        <div className={`p-6 rounded-2xl border-2 ${colors[variant]} space-y-2 shadow-inner`}>
            <p className="text-2xl font-black leading-none">{ value }</p>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-snug">{ label }</p>
        </div>
    );
};

const MetaRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-12">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{ label }</span>
        <div className="text-[11px] font-black text-text">{ value }</div>
    </div>
);

const AdminAction = ({ label, description, loading, onClick, variant }: any) => {
    const styles = {
        nebula: 'border-border/60 hover:border-accent/40 text-text',
        warning: 'border-orange-500/20 hover:border-orange-500/40 text-orange-400',
        danger: 'border-rose-500/20 hover:border-rose-500/40 text-rose-500'
    };
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`group w-full flex items-center justify-between p-6 bg-background border rounded-xl transition-all disabled:opacity-30 ${styles[variant as keyof typeof styles] || styles.nebula}`}
        >
            <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-widest">{ label }</p>
                <p className="text-[9px] font-bold opacity-40 uppercase">{ description }</p>
            </div>
            { loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight size={14} className="opacity-20" /> }
        </button>
    );
};

const ActionConfirm = ({ message, onConfirm, onCancel, loading, variant }: any) => (
    <div className={`p-8 rounded-xl border animate-in slide-in-from-bottom-2 ${variant === 'danger' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-text/80">{ message }</p>
        <div className="grid grid-cols-2 gap-4">
            <button onClick={onCancel} disabled={loading} className="py-3 bg-background border border-border text-text rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-surface">Annuler</button>
            <button onClick={onConfirm} disabled={loading} className={`py-3 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-rose-600' : 'bg-orange-600'}`}>
                { loading && <Loader2 className="w-3 h-3 animate-spin" /> } Confirmer
            </button>
        </div>
    </div>
);
