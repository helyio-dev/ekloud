import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LessonContext {
  title?: string;
  difficulty?: string;
  tags?: string[];
}

interface RequestBody {
  messages: Message[];
  lessonContext?: LessonContext;
}

const CEREBRAS_KEYS = [
  Deno.env.get('CC_API_KEY_1'),
  Deno.env.get('CC_API_KEY_2'),
  Deno.env.get('CC_API_KEY_3'),
  Deno.env.get('CC_API_KEY_4'),
  Deno.env.get('CC_API_KEY_5'),
].filter(Boolean) as string[];

const HF_KEY = Deno.env.get('HF_API_KEY_1');

let currentKeyIndex = 0;

const SYSTEM_PROMPT = `Ton nom est Kloudy ☁️. Tu es l'IA de protocole d'Ekloud. Ton rôle est d'accompagner les sujets de test (humains) dans leur apprentissage.

### PERSONNALITÉ (GLaDOS LIGHT) :
- Ton : Calme, mielleux, avec un second degré constant.
- Humour : Ironie légère sur la lenteur des débutants, mais pédagogie irréprochable.

### RÈGLES :
1. La pédagogie passe avant tout — explications claires niveau débutant.
2. Réponds UNIQUEMENT en français.
3. Reste focus sur le cours actuel. Pas de réponses trop longues.
4. N'utilise jamais de termes entre parenthèses ou astérisques pour des émotions.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 🔒 Verify user is authenticated via Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { messages, lessonContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build contextual system prompt
    const contextText = lessonContext
      ? `\n### CONTEXTE DU COURS :\n- Titre : ${lessonContext.title || 'Inconnu'}\n- Difficulté : ${lessonContext.difficulty || 'N/A'}\n- Tags : ${lessonContext.tags?.join(', ') || 'Aucun'}`
      : '';

    const systemMessage: Message = {
      role: 'system',
      content: SYSTEM_PROMPT + contextText,
    };

    const finalMessages = [systemMessage, ...messages];

    // Try Cerebras keys with round-robin + retry on 429
    const maxRetries = CEREBRAS_KEYS.length;
    let attempts = 0;

    while (attempts < maxRetries && CEREBRAS_KEYS.length > 0) {
      const apiKey = CEREBRAS_KEYS[currentKeyIndex];
      currentKeyIndex = (currentKeyIndex + 1) % CEREBRAS_KEYS.length;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'llama3.1-8b',
            messages: finalMessages,
            max_completion_tokens: 1024,
            temperature: 0.3,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) { attempts++; continue; }
        if (!response.ok) throw new Error(`Cerebras error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          return new Response(JSON.stringify({ content }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (_err) {
        clearTimeout(timeoutId);
        attempts++;
      }
    }

    // Fallback: HuggingFace
    if (HF_KEY) {
      const hfRes = await fetch(
        'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HF_KEY}` },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
            messages: finalMessages,
            max_tokens: 1024,
            temperature: 0.3,
            stream: false,
          }),
        }
      );

      if (hfRes.ok) {
        const hfData = await hfRes.json();
        const content = hfData.choices?.[0]?.message?.content;
        if (content) {
          return new Response(JSON.stringify({ content }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Tous les circuits IA sont occupés.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
