import { supabase } from '@/lib/supabase';
import { Github, Loader2, Linkedin, Twitch } from 'lucide-react';
import { useState } from 'react';

type Provider = 'microsoft' | 'discord' | 'github' | 'gitlab' | 'linkedin' | 'twitch';

export default function SocialAuth() {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSocialLogin = async (provider: any) => {
        setIsLoading(provider);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error(`${provider} login error:`, error.message);
            setIsLoading(null);
        }
    };


    const DiscordIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.923 2.991.076.076 0 0 0 .084-.027c.458-.627.866-1.287 1.21-1.982.028-.056.012-.112-.04-.132a13.104 13.104 0 0 1-1.859-.884.078.078 0 0 1-.008-.128c.125-.094.25-.192.37-.294a.076.076 0 0 1 .1-.01c3.931 1.807 8.18 1.807 12.069 0a.076.076 0 0 1 .1.01c.12.102.245.2.372.294a.077.077 0 0 1-.008.128c-.59.352-1.187.647-1.86.884-.052.02-.068.076-.04.132.344.695.752 1.355 1.21 1.982a.076.076 0 0 0 .084.027 19.856 19.856 0 0 0 6.023-2.991.082.082 0 0 0 .031-.057c.475-5.23-.839-9.742-3.601-13.66a.066.066 0 0 0-.032-.027zm-12.064 10.1c-1.184 0-2.164-1.09-2.164-2.427 0-1.337.957-2.427 2.164-2.427 1.219 0 2.185 1.09 2.165 2.427 0 1.337-.957 2.427-2.165 2.427zm7.983 0c-1.184 0-2.164-1.09-2.164-2.427 0-1.337.957-2.427 2.164-2.427 1.219 0 2.185 1.09 2.165 2.427 0 1.337-.957 2.427-2.165 2.427z" />
        </svg>
    );


    const GitlabIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="m23.498 13.528-.158-.485L12 1.36 1.356 12.347l2.844 8.76L12 24l7.8-2.893 3.698-7.579Zm-11.5-12.168 1.95 6.023H9.55l1.95-6.023h.498ZM8.677 8.355l-2.617 8.08L12 24l5.94-7.565-2.617-8.08H8.677ZM1.356 12.347h6.444l4.2 11.653-9.288-11.653Zm14.844 0h6.444l-9.288 11.653 2.844-11.653Z" />
        </svg>
    );

    const providers = [
        { id: 'github', name: 'GitHub', icon: <Github className="w-5 h-5" />, color: 'hover:bg-[#24292e]/10' },
        { id: 'discord', name: 'Discord', icon: <DiscordIcon />, color: 'hover:bg-[#5865F2]/10' },
        { id: 'gitlab', name: 'GitLab', icon: <GitlabIcon />, color: 'hover:bg-[#e24329]/10' },
        { id: 'linkedin_oidc', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: 'hover:bg-[#0077b5]/10' },
        { id: 'twitch', name: 'Twitch', icon: <Twitch className="w-5 h-5" />, color: 'hover:bg-[#9146ff]/10' },
    ];

    return (
        <div className="space-y-4 w-full mt-4">
            <div className="grid grid-cols-2 gap-3">
                {providers.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => handleSocialLogin(p.id)}
                        disabled={!!isLoading}
                        className={`flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl transition-all text-sm font-semibold disabled:opacity-50 group ${p.color}`}
                    >
                        <div className="text-text-muted group-hover:text-text transition-colors">
                            {isLoading === p.id ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : p.icon}
                        </div>
                        <span className="truncate">{p.name}</span>
                    </button>
                ))}
            </div>

            
            <p className="text-center text-[10px] text-text-muted px-4 mt-6">
                En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
        </div>
    );
}
