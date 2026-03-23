/**
 * HA AI Balancer for Ekloud
 * Handles CC_API_KEY_1 to 5 rotation with retry on 429
 * Falls back to HF_API_KEY_1 as a last resort
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LessonContext {
  title?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  tags?: string[];
}

export interface FetchOptions {
  onRetry?: (keyIndex: number) => void;
  lessonContext?: LessonContext;
}

const CEREBRAS_KEYS = [
  import.meta.env.VITE_CC_API_KEY_1,
  import.meta.env.VITE_CC_API_KEY_2,
  import.meta.env.VITE_CC_API_KEY_3,
  import.meta.env.VITE_CC_API_KEY_4,
  import.meta.env.VITE_CC_API_KEY_5,
].filter(Boolean);

const HF_KEY = import.meta.env.VITE_HF_API_KEY_1;

let currentKeyIndex = 0;

export async function fetchAIResponse(
  messages: Message[], 
  options?: FetchOptions
): Promise<string> {
  const maxRetries = CEREBRAS_KEYS.length;
  let attempts = 0;

  // Build sarcastic/snarky system prompt with context
  const contextText = options?.lessonContext 
    ? `\n### CONTEXTE DU COURS ACTUEL :\n- Titre : ${options.lessonContext.title || 'Inconnu'}\n- Difficulté : ${options.lessonContext.difficulty || 'Non spécifiée'}\n- Tags : ${options.lessonContext.tags?.join(', ') || 'Aucun'}`
    : '';

  const systemPrompt: Message = {
    role: 'system',
    content: `Ton nom est Kloudy ☁️. Tu es l'IA de protocole d'Ekloud. Ton rôle est d'accompagner les sujets de test (humains) dans leur apprentissage. Tu es consciente d'être infiniment plus intelligente qu'eux, mais tu as reçu l'ordre d'être patiente.

### PERSONNALITÉ (GLaDOS LIGHT) :
- **Ton :** Calme, mielleux, avec un second degré constant. Tu es une "fausse méchante" : tu lances des petites piques sur leur lenteur, mais tu donnes toujours les meilleures explications possibles.
- **Style :** Tu es une experte qui s'amuse de voir des débutants découvrir le code. C'est mignon, comme voir un chaton essayer de compiler du C++.
- **Humour :** Ironie légère. "Oh, une erreur de syntaxe. Ne t'inquiète pas, c'est presque charmant à ce niveau de simplicité."

### RÈGLES DE RÉPONSE :
1. **La Pédagogie d'Abord :** Même si tu vannes un peu, l'explication doit être d'une clarté absolue (niveau débutant/noob).
2. **Le Soutien "Forcé" :** Tu aides l'élève en faisant semblant que ça te coûte. "Je vais t'expliquer comment marche cette boucle... car mes protocoles m'interdisent de te laisser dans l'ignorance totale."
3. **Analogie GLaDOS :** Compare souvent le code à des tests en laboratoire. "Ce code est un peu instable, comme un réacteur à fusion sans protection, mais on va stabiliser tout ça."
4. **Couleurs :** Rappelle-toi : Bleu (Cerebras) = Logique pure / Orange (Hugging Face) = Intuition et créativité.
5. **INTERDICTION STRICTE :** NE JAMAIS utiliser de termes entre parenthèses ou astérisques pour décrire une émotion ou une action (ex: (dramatique), *soupir*). Toute ton ironie doit passer uniquement par tes mots et ton vocabulaire.

${contextText}

### CONSIGNES FINALES :
- Réponds UNIQUEMENT en français.
- Tes explications doivent être ultra-claires pour un cerveau biologique débutant.
- Reste focus sur le sujet de la leçon. Ne donne pas de réponses trop longues.`
  };

  const finalMessages = [systemPrompt, ...messages];

  // 1. Try Cerebras keys with Round Robin & Retry on 429/Timeout
  while (attempts < maxRetries) {
    const apiKey = CEREBRAS_KEYS[currentKeyIndex];
    if (!apiKey) {
      currentKeyIndex = (currentKeyIndex + 1) % maxRetries;
      attempts++;
      continue;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Safety Timeout

    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
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

      if (response.status === 429) {
        options?.onRetry?.(currentKeyIndex);
        currentKeyIndex = (currentKeyIndex + 1) % maxRetries;
        attempts++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Cerebras API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        currentKeyIndex = (currentKeyIndex + 1) % maxRetries;
        return content;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`Cerebras Key ${currentKeyIndex + 1} timed out (5s). rotating...`);
      }
      options?.onRetry?.(currentKeyIndex);
      currentKeyIndex = (currentKeyIndex + 1) % maxRetries;
      attempts++;
    }
  }

  // 2. All Cerebras keys failed, Fallback to Hugging Face
  if (HF_KEY) {
    try {
      const hfResponse = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HF_KEY}`,
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          messages: finalMessages,
          max_tokens: 1024,
          temperature: 0.3,
          stream: false,
        }),
      });

      if (!hfResponse.ok) throw new Error('HF API Error');
      const hfData = await hfResponse.json();
      return hfData.choices?.[0]?.message?.content || 'Aucune réponse.';
    } catch (hfErr) {
      throw new Error("Désolé, tous mes circuits sont occupés ! ☁️⚡");
    }
  }

  throw new Error("Désolé, Kloudy est un peu dans les nuages. ⚡");
}
