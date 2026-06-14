import { BadgeDefinition, BadgeRarity, RARITY_CONFIG } from '@/lib/badges';

interface BadgeCardProps {
  badge: BadgeDefinition;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
}

export default function BadgeCard({ badge, earnedAt, size = 'md', locked = false }: BadgeCardProps) {
  const conf = RARITY_CONFIG[badge.rarity as BadgeRarity] || RARITY_CONFIG.common;
  const sizeClasses = {
    sm: { wrap: 'p-3', icon: 'text-2xl', name: 'text-[10px]', rarity: 'hidden' },
    md: { wrap: 'p-4', icon: 'text-3xl', name: 'text-xs', rarity: 'text-[9px]' },
    lg: { wrap: 'p-5', icon: 'text-4xl', name: 'text-sm', rarity: 'text-[10px]' },
  }[size];

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border transition-all ${sizeClasses.wrap} ${locked ? 'bg-surface/30 border-border/30 opacity-40 grayscale' : `${conf.bg} ${conf.border} ${conf.glow}`}`} title={badge.description}>
      <span className={sizeClasses.icon}>{badge.icon}</span>
      <div className="text-center space-y-0.5">
        <p className={`font-black uppercase tracking-tight leading-none ${sizeClasses.name} ${locked ? 'text-text-muted' : 'text-text'}`}>{badge.name}</p>
        <p className={`font-black uppercase tracking-widest ${sizeClasses.rarity} ${conf.color} opacity-80`}>{conf.label}</p>
      </div>
      {earnedAt && size === 'lg' && (
        <p className="text-[9px] text-text-muted/50 font-medium">{new Date(earnedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      )}
    </div>
  );
}
