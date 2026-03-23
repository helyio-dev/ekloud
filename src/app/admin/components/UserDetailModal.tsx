import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Shield, User, Trash2, RefreshCw, Mail, Loader2, BookOpen, FileText, Target, AlertTriangle } from 'lucide-react';
import type { AdminUser } from './UserManagementTab';

type UserStats = {
    modulesCompleted: number;
    lessonsCompleted: number;
    quizAttempts: number;
};

type Props = {
    user: AdminUser;
    onClose: () => void;
    onUserUpdated: (updated: Partial<AdminUser> & { id: string }) => void;
    onUserDeleted: (id: string) => void;
};

export default function UserDetailModal({ user, onClose, onUserUpdated, onUserDeleted }: Props) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const [{ count: modulesCompleted }, { count: lessonsCompleted }, { count: quizAttempts }] = await Promise.all([
                    supabase.from('user_modules').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
                    supabase.from('user_lessons').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
                    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                ]);
                setStats({ modulesCompleted: modulesCompleted ?? 0, lessonsCompleted: lessonsCompleted ?? 0, quizAttempts: quizAttempts ?? 0 });
            } catch (err) {
                console.error('UserDetailModal: fetchStats error:', err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, [user.id]);

    const showFeedback = (type: 'success' | 'error', msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

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
            showFeedback('success', `Rôle changé en "${newRole}".`);
        } catch (err: any) {
            showFeedback('error', err.message || 'Erreur lors du changement de rôle.');
        } finally {
            setIsActionLoading(null);
        }
    };

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
            showFeedback('success', 'Progression réinitialisée avec succès.');
        } catch (err: any) {
            showFeedback('error', err.message || 'Erreur lors de la réinitialisation.');
        } finally {
            setIsActionLoading(null);
            setConfirm(null);
        }
    };

    const handlePasswordReset = async () => {
        setIsActionLoading('password');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback`,
            });
            if (error) throw error;
            showFeedback('success', `Email de réinitialisation envoyé à ${user.email}.`);
        } catch (err: any) {
            showFeedback('error', err.message || 'Erreur lors de l\'envoi de l\'email.');
        } finally {
            setIsActionLoading(null);
        }
    };

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
            showFeedback('error', err.message || 'Erreur lors de la suppression. Vérifiez les politiques RLS.');
            setIsActionLoading(null);
            setConfirm(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            {}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {}
            <div className="relative w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
                {}
                <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {(user.username ?? user.email ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text">{user.username ?? 'Sans pseudo'}</h2>
                            <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {}
                    {feedback && (
                        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                            {feedback.msg}
                        </div>
                    )}

                    {}
                    <section>
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Statistiques</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <StatMini label="XP" value={user.xp.toLocaleString()} color="text-accent" />
                            <StatMini label="Niveau" value={String(user.level)} color="text-purple-400" />
                            <StatMini label="Série" value={`${user.streak}🔥`} color="text-orange-400" />
                        </div>

                        {loadingStats ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                            </div>
                        ) : stats && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <StatMiniIcon label="Modules" value={String(stats.modulesCompleted)} icon={<BookOpen className="w-4 h-4 text-blue-400" />} />
                                <StatMiniIcon label="Leçons" value={String(stats.lessonsCompleted)} icon={<FileText className="w-4 h-4 text-green-400" />} />
                                <StatMiniIcon label="Quiz" value={String(stats.quizAttempts)} icon={<Target className="w-4 h-4 text-yellow-400" />} />
                            </div>
                        )}
                    </section>

                    {}
                    <section>
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Compte</h3>
                        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-2 text-sm">
                            <Row label="Rôle actuel" value={
                                user.role === 'admin'
                                    ? <span className="text-yellow-400 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                                    : user.role === 'contributor'
                                    ? <span className="text-green-400 font-bold flex items-center gap-1"><BookOpen className="w-3 h-3" /> Contributeur</span>
                                    : <span className="text-text-muted flex items-center gap-1"><User className="w-3 h-3" /> Étudiant</span>
                            } />
                            <Row label="Inscrit le" value={new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                        </div>
                    </section>

                    {}
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Actions</h3>

                        {}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleRoleChange('student')}
                                disabled={user.role === 'student' || (isActionLoading !== null && isActionLoading.startsWith('role'))}
                                className={`px-2 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${user.role === 'student' ? 'bg-surface text-text border-transparent shadow-inner' : 'border-border text-text-muted hover:border-accent/30 hover:bg-surface-hover'}`}
                            >
                                <User className="w-4 h-4" /> Étudiant
                            </button>
                            <button
                                onClick={() => handleRoleChange('contributor')}
                                disabled={user.role === 'contributor' || (isActionLoading !== null && isActionLoading.startsWith('role'))}
                                className={`px-2 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${user.role === 'contributor' ? 'bg-green-400/10 text-green-400 border-green-400/20 shadow-inner' : 'border-border text-text-muted hover:border-green-400/30 hover:bg-green-400/5 hover:text-green-400'}`}
                            >
                                <BookOpen className="w-4 h-4" /> Contributeur
                            </button>
                            <button
                                onClick={() => handleRoleChange('admin')}
                                disabled={user.role === 'admin' || (isActionLoading !== null && isActionLoading.startsWith('role'))}
                                className={`px-2 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${user.role === 'admin' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20 shadow-inner' : 'border-border text-text-muted hover:border-yellow-400/30 hover:bg-yellow-400/5 hover:text-yellow-400'}`}
                            >
                                <Shield className="w-4 h-4" /> Admin
                            </button>
                        </div>

                        {}
                        <ActionButton
                            icon={<Mail className="w-4 h-4" />}
                            label="Envoyer réinitialisation mot de passe"
                            description={`Envoie un email à ${user.email}`}
                            loading={isActionLoading === 'password'}
                            onClick={handlePasswordReset}
                            variant="default"
                        />

                        {}
                        {confirm === 'reset' ? (
                            <ConfirmBox
                                message="Remettre XP, niveau, série à zéro et supprimer toute la progression ?"
                                onConfirm={handleResetProgress}
                                onCancel={() => setConfirm(null)}
                                loading={isActionLoading === 'reset'}
                                variant="warning"
                            />
                        ) : (
                            <ActionButton
                                icon={<RefreshCw className="w-4 h-4" />}
                                label="Réinitialiser la progression"
                                description="Remet XP, niveau et modules à zéro"
                                loading={false}
                                onClick={() => setConfirm('reset')}
                                variant="warning"
                            />
                        )}

                        {}
                        {confirm === 'delete' ? (
                            <ConfirmBox
                                message="Supprimer définitivement ce compte et toutes ses données ?"
                                onConfirm={handleDelete}
                                onCancel={() => setConfirm(null)}
                                loading={isActionLoading === 'delete'}
                                variant="danger"
                            />
                        ) : (
                            <ActionButton
                                icon={<Trash2 className="w-4 h-4" />}
                                label="Supprimer le compte"
                                description="Action irréversible — supprime toutes les données"
                                loading={false}
                                onClick={() => setConfirm('delete')}
                                variant="danger"
                            />
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}



function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-background/50 border border-border rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
        </div>
    );
}

function StatMiniIcon({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-background/50 border border-border rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-black text-text">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-text-muted">{label}</span>
            <span className="text-text font-medium">{value}</span>
        </div>
    );
}

function ActionButton({ icon, label, description, loading, onClick, variant }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    loading: boolean;
    onClick: () => void;
    variant: 'default' | 'warning' | 'danger';
}) {
    const colors = {
        default: 'border-border hover:border-accent/40 hover:bg-accent/5 text-text',
        warning: 'border-orange-400/20 hover:border-orange-400/60 hover:bg-orange-400/5 text-orange-400',
        danger: 'border-red-400/20 hover:border-red-400/60 hover:bg-red-400/5 text-red-400',
    };
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`w-full flex items-center gap-3 p-4 bg-background/30 border rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${colors[variant]}`}
        >
            <div className="shrink-0">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </div>
        </button>
    );
}

function ConfirmBox({ message, onConfirm, onCancel, loading, variant }: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
    variant: 'warning' | 'danger';
}) {
    const colors = {
        warning: { border: 'border-orange-400/30 bg-orange-400/5', btn: 'bg-orange-500 hover:bg-orange-400' },
        danger: { border: 'border-red-400/30 bg-red-400/5', btn: 'bg-red-600 hover:bg-red-500' },
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[variant].border}`}>
            <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-sm text-text">{message}</p>
            </div>
            <div className="flex gap-2">
                <button onClick={onCancel} disabled={loading} className="flex-1 py-2 bg-surface-hover text-text rounded-lg text-sm font-bold transition-colors">
                    Annuler
                </button>
                <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${colors[variant].btn}`}>
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Confirmer
                </button>
            </div>
        </div>
    );
}
