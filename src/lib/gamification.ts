export const XP_REWARDS = {
    easy: 10,
    medium: 25,
    hard: 50,
    very_hard: 100
};


export function formatXP(xp: number): string {
    if (xp >= 1000000) {
        return (xp / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (xp >= 1000) {
        return (xp / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return xp.toString();
}


export function calculateLevelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}


export function getXpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
}


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

    const progress = Math.min(100, Math.max(0, (xpIntoCurrentLevel / totalXpInTier) * 100));

    return {
        progress,
        currentLevelXp: xpIntoCurrentLevel,
        requiredXpForNext: totalXpInTier,
        level: currentLevel
    };
}


export async function addXp(
    supabase: any,
    userId: string,
    currentXp: number,
    amountToAdd: number,
    currentStreak: number = 0
) {
    const newXp = currentXp + amountToAdd;
    const newLevel = calculateLevelFromXp(newXp);

    // Fetch profile for streak logic
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
