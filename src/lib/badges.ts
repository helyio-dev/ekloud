import { supabase } from './supabase';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: BadgeRarity;
    xp_required?: number | null;
}

export interface UserBadge {
    badge_id: string;
    earned_at: string;
    badge_definitions: BadgeDefinition;
}

export const RARITY_CONFIG: Record<BadgeRarity, { label: string; color: string; bg: string; border: string; glow: string }> = {
    common:    { label: 'Commun',     color: 'text-text-muted',   bg: 'bg-surface',           border: 'border-border',          glow: '' },
    rare:      { label: 'Rare',       color: 'text-blue-400',     bg: 'bg-blue-400/10',       border: 'border-blue-400/20',     glow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]' },
    epic:      { label: 'Épique',     color: 'text-purple-400',   bg: 'bg-purple-400/10',     border: 'border-purple-400/20',   glow: 'shadow-[0_0_20px_rgba(192,132,252,0.25)]' },
    legendary: { label: 'Légendaire', color: 'text-amber-400',    bg: 'bg-amber-400/10',      border: 'border-amber-400/20',    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]' },
};

/**
 * Récupère tous les badges d'un utilisateur avec leurs définitions.
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, badge_definitions(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

    if (error) {
        console.error('[BADGES] getUserBadges error:', error.message);
        return [];
    }
    return (data || []) as UserBadge[];
}

/**
 * Attribue un badge à un utilisateur (ignore si déjà possédé).
 * Retourne true si le badge a été nouvellement attribué.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId });

    if (error) {
        // Code 23505 = unique violation = badge déjà possédé, pas une erreur
        if (error.code !== '23505') {
            console.error('[BADGES] awardBadge error:', error.message);
        }
        return false;
    }
    return true;
}

/**
 * Vérifie et attribue automatiquement les badges mérités selon le profil actuel.
 * À appeler après chaque action significative (leçon, module, streak, amis, etc.).
 */
export async function checkAndAwardBadges(userId: string, context: {
    xp?: number;
    streak?: number;
    completedModules?: number;
    completedLessons?: number;
    passedExams?: number;
    friendCount?: number;
    clan?: string | null;
    examScore?: number; // 0-100
}): Promise<string[]> {
    const awarded: string[] = [];

    const give = async (id: string) => {
        const ok = await awardBadge(userId, id);
        if (ok) awarded.push(id);
    };

    const { xp = 0, streak = 0, completedModules = 0, completedLessons = 0, passedExams = 0, friendCount = 0, clan, examScore } = context;

    // Apprentissage
    if (completedLessons >= 1)  await give('first_lesson');
    if (completedModules >= 1)  await give('first_module');
    if (completedModules >= 5)  await give('modules_5');
    if (completedModules >= 10) await give('modules_10');
    if (passedExams >= 1)       await give('first_exam');
    if (examScore === 100)      await give('perfect_exam');

    // Régularité
    if (streak >= 7)   await give('streak_7');
    if (streak >= 30)  await give('streak_30');
    if (streak >= 100) await give('streak_100');

    // XP
    if (xp >= 500)   await give('xp_500');
    if (xp >= 2000)  await give('xp_2000');
    if (xp >= 10000) await give('xp_10000');

    // Social
    if (friendCount >= 1) await give('first_friend');
    if (friendCount >= 5) await give('friends_5');

    // Clan
    if (clan) await give('clan_joined');

    return awarded;
}
