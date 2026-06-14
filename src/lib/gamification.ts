import type { SupabaseClient } from '@supabase/supabase-js';

// paliers de récompenses xp selon la difficulté du contenu
export const XP_REWARDS: Record<string, number> = {
    'Découverte': 10,
    'Fondamentaux': 25,
    'Avancé': 50,
    'Expert': 100
};

/**
 * formatage lisible des points xp (ex: 1.2k, 5M).
 */
export function formatXP(xp: number): string {
    if (xp >= 1000000) {
        return (xp / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (xp >= 1000) {
        return (xp / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return xp.toString();
}

/**
 * calcul du niveau utilisateur basé sur l'xp totale accumulée.
 * utilise une courbe de croissance quadratique.
 */
export function calculateLevelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * retourne le seuil d'xp minimum requis pour atteindre un niveau donné.
 */
export function getXpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
}

/**
 * calcul détaillé de la progression vers le prochain niveau.
 */
export function calculateLevelProgress(xp: number): {
    progress: number;
    currentLevelXp: number;
    requiredXpForNext: number;
    level: number;
} {
    const currentLevel = calculateLevelFromXp(xp);
    const xpForCurrentLevel = getXpForLevel(currentLevel);
    const xpForNextLevel = getXpForLevel(currentLevel + 1);

    const xpIntoCurrentLevel = xp - xpForCurrentLevel;
    const totalXpInTier = xpForNextLevel - xpForCurrentLevel;

    // calcul du pourcentage de progression (bridé entre 0 et 100)
    const progress = Math.min(100, Math.max(0, (xpIntoCurrentLevel / totalXpInTier) * 100));

    return {
        progress,
        currentLevelXp: xpIntoCurrentLevel,
        requiredXpForNext: totalXpInTier,
        level: currentLevel
    };
}

/**
 * ajoute de l'xp à l'utilisateur et gère la série d'activité (streak).
 * une série est incrémentée si l'activité a lieu sur un nouveau jour civil.
 */
export async function addXp(
    supabase: SupabaseClient,
    userId: string,
    currentXp: number,
    amountToAdd: number,
    currentStreak: number = 0
) {
    const newXp = currentXp + amountToAdd;
    const newLevel = calculateLevelFromXp(newXp);

    // récupération des métadonnées temporelles du profil
    const { data: profile } = await supabase
        .from('profiles')
        .select('last_streak_at')
        .eq('id', userId)
        .single();

    let newStreak = currentStreak;
    const now = new Date();
    const lastStreak = profile?.last_streak_at ? new Date(profile.last_streak_at) : null;

    if (!lastStreak) {
        newStreak = 1;
    } else {
        const diffInHours = (now.getTime() - lastStreak.getTime()) / (1000 * 60 * 60);
        const isSameDay = now.toDateString() === lastStreak.toDateString();

        if (!isSameDay) {
            // tolérance de 48h (un jour ouvré de battement) pour maintenir la série
            if (diffInHours <= 48) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        }
    }

    const updatePayload: any = {
        xp: newXp,
        level: newLevel
    };

    // mise à jour de la série uniquement en cas de changement de jour
    if (newStreak !== currentStreak || !lastStreak || (now.toDateString() !== lastStreak?.toDateString())) {
        updatePayload.streak = newStreak;
        updatePayload.last_streak_at = now.toISOString();
    }

    const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

    return { newXp, newLevel, newStreak, error };
}
