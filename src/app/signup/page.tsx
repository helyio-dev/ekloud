import { Cloud } from 'lucide-react';
import SocialAuth from '@/components/SocialAuth';

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 mb-6 group hover:scale-110 transition-transform duration-300">
                        <Cloud className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold text-center tracking-tight">Rejoindre Ekloud</h1>
                    <p className="text-text-muted text-sm text-center mt-3 max-w-[280px]">
                        Crée ton compte via Discord ou GitHub pour commencer ton aventure.
                    </p>
                </div>

                <div className="space-y-6">
                    <SocialAuth />
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[11px] text-text-muted">
                        Pas de mot de passe à retenir. Sécurisé via OAuth.
                    </p>
                </div>
            </div>
        </div>
    );
}
