/**
 * Tech-Tree Layout Utility
 * Calculates X/Y positions for a branching dependency tree.
 */

export interface PositionedNode {
    id: string;
    x: number;
    y: number;
    depth: number;
    side: 'left' | 'right' | 'center';
    direction?: 'up' | 'down' | 'left' | 'right' | 'root';
}

export function calculateTreeLayout(
    skills: { id: string, y_pos?: number }[], 
    prereqs: { skill_id: string, prerequisite_skill_id: string }[],
    stepHeight = 300,
    width = 800
): Record<string, PositionedNode> {
    const layout: Record<string, PositionedNode> = {};
    const skillIds = skills.map(s => s.id);
    const depths: Record<string, number> = {};
    
    // 1. Calculate depths (longest path from any root)
    const getDepth = (id: string, visited = new Set<string>()): number => {
        if (id in depths) return depths[id];
        if (visited.has(id)) return 0; 
        visited.add(id);
        
        const parents = prereqs.filter(p => p.skill_id === id);
        if (parents.length === 0) return (depths[id] = 0);
        
        const maxParentDepth = Math.max(...parents.map(p => getDepth(p.prerequisite_skill_id, visited)));
        return (depths[id] = maxParentDepth + 1);
    };
    
    skillIds.forEach(id => getDepth(id));
    
    // 2. Group by depth and sort by original preference (y_pos)
    const levels: Record<number, string[]> = {};
    Object.entries(depths).forEach(([id, d]) => {
        if (!levels[d]) levels[d] = [];
        levels[d].push(id);
    });
    
    // 3. Assign positions
    Object.entries(levels).forEach(([dStr, ids]) => {
        const d = parseInt(dStr);
        const y = d * stepHeight;
        
        // Sort ids at this level by their original y_pos preference
        const sortedIds = [...ids].sort((a, b) => {
            const skillA = skills.find(s => s.id === a);
            const skillB = skills.find(s => s.id === b);
            return (skillA?.y_pos || 0) - (skillB?.y_pos || 0);
        });

        const count = sortedIds.length;
        const spacing = width / Math.max(count, 1);
        
        sortedIds.forEach((id, i) => {
            // Horizontal centering
            const offset = (i - (count - 1) / 2) * spacing;
            
            layout[id] = { 
                id, 
                x: offset, 
                y, 
                depth: d,
                side: offset < -50 ? 'left' : offset > 50 ? 'right' : 'center'
            };
        });
    });
    
    return layout;
}

export function calculateStarLayout(
    skills: { id: string, name?: string }[], 
    prereqs: { skill_id: string, prerequisite_skill_id: string }[],
    stepSize = 250
): Record<string, PositionedNode> {
    const layout: Record<string, PositionedNode> = {};
    const skillIds = skills.map(s => s.id);
    
    // 1. Identify roots (no prerequisites)
    const roots = skillIds.filter(id => !prereqs.some(p => p.skill_id === id));
    if (roots.length === 0 && skillIds.length > 0) roots.push(skillIds[0]);

    const visited = new Set<string>();

    const assignPos = (id: string, x: number, y: number, dir: 'up' | 'down' | 'left' | 'right' | 'root', depth: number) => {
        if (visited.has(id)) return;
        visited.add(id);
        
        layout[id] = { 
            id, x, y, depth, 
            direction: dir,
            side: x < -50 ? 'left' : x > 50 ? 'right' : 'center' 
        };

        const children = prereqs.filter(p => p.prerequisite_skill_id === id).map(p => p.skill_id);
        children.forEach((childId, index) => {
            let nextX = x, nextY = y;
            const spread = (index - (children.length - 1) / 2) * (stepSize * 0.8);

            if (dir === 'right') {
                nextX += stepSize;
                nextY += spread;
            } else if (dir === 'left') {
                nextX -= stepSize;
                nextY += spread;
            } else if (dir === 'down') {
                nextY += stepSize;
                nextX += spread;
            } else if (dir === 'up') {
                nextY -= stepSize;
                nextX += spread;
            } else {
                // Root distribution
                const dirs = ['right', 'down', 'left', 'up'];
                const nextDir = dirs[index % 4] as 'up' | 'down' | 'left' | 'right';
                if (nextDir === 'right') nextX += stepSize;
                else if (nextDir === 'left') nextX -= stepSize;
                else if (nextDir === 'down') nextY += stepSize;
                else if (nextDir === 'up') nextY -= stepSize;
                assignPos(childId, nextX, nextY, nextDir, depth + 1);
                return;
            }
            assignPos(childId, nextX, nextY, dir as 'up' | 'down' | 'left' | 'right' | 'root', depth + 1);
        });
    };

    roots.forEach((rootId, i) => {
        assignPos(rootId, i * stepSize, 0, 'root', 0);
    });

    // Handle unreachable skills
    skillIds.forEach(id => {
        if (!visited.has(id)) {
            assignPos(id, 0, (Object.keys(layout).length + 1) * stepSize, 'down', 0);
        }
    });

    return layout;
}
