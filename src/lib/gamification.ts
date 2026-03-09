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
    amountToAdd: number
) {
    const newXp = currentXp + amountToAdd;
    const newLevel = calculateLevelFromXp(newXp);

    
    const { error } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', userId);

    return { newXp, newLevel, error };
}
