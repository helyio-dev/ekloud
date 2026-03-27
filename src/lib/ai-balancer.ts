/**
 * AI Balancer for Ekloud — Secure Edition
 * All API calls go through the Supabase Edge Function `ai-proxy`.
 * No API keys are ever bundled into the client JS.
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
  // Get the current session token to authenticate the Edge Function call
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour utiliser Kloudy.');
  }

  // Call the server-side AI proxy — keys never touch the client
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
