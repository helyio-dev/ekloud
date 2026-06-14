/**
 * équilibreur ia pour ekloud — édition sécurisée
 * tous les appels d'api passent par la fonction edge supabase `ai-proxy`.
 * aucune clé d'api n'est jamais incluse dans le js du client.
 */

import { supabase } from './supabase';

export interface LessonContext {
  title?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
}

export interface FetchOptions {
  onRetry?: (keyIndex: number) => void;
  lessonContext?: LessonContext;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function fetchAIResponse(
  messages: Message[],
  options?: FetchOptions
): Promise<string> {
  // obtenir le jeton de session actuel pour authentifier l'appel à la fonction edge
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour utiliser Kloudy.');
  }

  // appeler le proxy ia côté serveur — les clés ne touchent jamais le client
  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: {
      messages,
      lessonContext: options?.lessonContext,
    },
  });

  if (error) {
    throw new Error(error.message || '☁️ **Éclair de bug !** Kloudy a un petit souci.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.content) {
    throw new Error('Désolé, Kloudy est un peu dans les nuages. ⚡');
  }

  return data.content as string;
}
