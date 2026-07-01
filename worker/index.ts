import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DEBUG?: string;
}


export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // NOTE: keep logs minimal in production.
    // Enable noisy logs only when DEBUG is enabled.
    const debug = env.DEBUG === 'true';
    if (debug) {
      console.log('=== Incoming request ===');
      console.log('Method:', request.method);
      console.log('URL:', request.url);
    }


    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-10-28.acacia' as any,
      });

      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const url = new URL(request.url);

      // Webhook Handler
      // Accept both `/webhook` and `/webhook/` (Stripe dashboards sometimes differ by trailing slash).
      if (request.method === 'POST' && /\/webhook\/?$/.test(url.pathname)) {
        if (debug) console.log('Handling webhook');

        const signature = request.headers.get('stripe-signature');
        if (!signature) {
          return new Response(JSON.stringify({ error: 'Missing signature' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Stripe signature verification requires the raw body.
        // Cloudflare may not preserve raw bytes when using request.text(),
        // but this is the best we can do in this environment.
        const body = await request.text();
        if (debug) console.log('Webhook body received');

        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
          if (debug) console.log('Webhook event verified:', event.type);
        } catch (err: any) {
          console.error('Webhook signature error:', err);
          return new Response(JSON.stringify({ error: 'Invalid signature', details: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          const metadata = session.metadata;
          
          if (debug) console.log('Processing completed checkout:', metadata);
          
          // Determine user ID: from metadata (API sessions) or client_reference_id (Payment Links)
          const userId = metadata?.user_id || session.client_reference_id || null;
          
          if (!userId) {
            console.error('No user ID found in session metadata or client_reference_id');
            return new Response(JSON.stringify({ received: true, warning: 'no_user_id' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Update existing transaction if it was created via API checkout flow
          if (metadata?.user_id) {
            const { error: updateError } = await supabase.from('transactions')
              .update({ 
                status: 'completed',
                stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id 
              })
              .eq('stripe_checkout_session_id', session.id);

            if (updateError) {
              console.error('Error updating transaction status:', updateError);
            } else {
              console.log('Transaction status updated to completed');
            }
          }

          // Determine the purchase type from metadata or by matching Payment Link line items
          let purchaseType = metadata?.type || null;
          let gelCount = metadata?.gel_count ? parseInt(metadata.gel_count) : 0;

          // If no metadata type, this is a Payment Link purchase — resolve from line items
          if (!purchaseType) {
            if (debug) console.log('No metadata type — resolving from Payment Link line items');
            try {
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
              const itemName = lineItems.data[0]?.description || '';
              const amountCents = lineItems.data[0]?.amount_total || 0;
              if (debug) console.log('Payment Link line item:', itemName, amountCents);

              // Map known Payment Link products by amount (in cents)
              const PAYMENT_LINK_MAP: Record<number, { type: string; gelCount: number; packId: string }> = {
                99:   { type: 'gel_pack', gelCount: 1, packId: 'ping' },
                249:  { type: 'gel_pack', gelCount: 3, packId: 'reboot' },
                399:  { type: 'gel_pack', gelCount: 5, packId: 'afk' },
                699:  { type: 'gel_pack', gelCount: 10, packId: 'overclock' },
                199:  { type: 'streak_recovery', gelCount: 0, packId: '' },
              };

              const matched = PAYMENT_LINK_MAP[amountCents];
              if (matched) {
                purchaseType = matched.type;
                gelCount = matched.gelCount;
                if (debug) console.log('Matched Payment Link product:', matched);

                // Insert transaction since it was not created via the API flow
                await supabase.from('transactions').insert({
                  user_id: userId,
                  type: matched.type,
                  amount: amountCents / 100,
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
                  metadata: { user_id: userId, type: matched.type, pack_id: matched.packId, gel_count: String(matched.gelCount) },
                  status: 'completed',
                });
              } else {
                console.warn('Unknown Payment Link amount:', amountCents);
              }
            } catch (lineItemErr) {
              console.error('Error fetching line items:', lineItemErr);
            }
          }

          // Execute the corresponding action
          if (purchaseType === 'gel_pack' && gelCount > 0) {
            if (debug) console.log('Adding freeze gels:', gelCount);
            const { error: rpcError } = await supabase.rpc('add_freeze_gels', {
              user_id: userId,
              amount: gelCount
            });
            if (rpcError) {
              console.error('Error calling add_freeze_gels RPC:', rpcError);
          } else {
                if (debug) console.log('Successfully added freeze gels via RPC');
            }
          } else if (purchaseType === 'streak_recovery') {
            // Security guard: only allow recovery if the streak lost value is > 0 (per SQL logic)
            // We use profiles.streak as the source of truth for “lost streak”.
            try {
              const { data: profileRow, error: streakFetchError } = await supabase
                .from('profiles')
                .select('streak')
                .eq('id', userId)
                .single();

              if (streakFetchError) {
                console.error('Error fetching profile streak for streak_recovery:', streakFetchError);
                return new Response(JSON.stringify({ received: true, warning: 'streak_fetch_failed' }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }

              const currentStreakValue = profileRow?.streak ?? 0;

              if (currentStreakValue > 0) {
                if (debug) console.log('Recovering streak (allowed)');
                const { error: rpcError } = await supabase.rpc('recover_streak', {
                  user_id: userId,
                });

                if (rpcError) {
                  console.error('Error calling recover_streak RPC:', rpcError);
                } else {
                  if (debug) console.log('Successfully recovered streak via RPC');
                }
              } else {
                if (debug) console.log('Streak recovery skipped: streak lost value is not > 0');
              }
            } catch (e) {
              console.error('Error during streak_recovery guard:', e);
            }
          }

        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Checkout Session Creation Handler
      if (request.method === 'POST') {
        if (debug) console.log('Handling checkout session request');
        const body = await request.json() as any;
        if (debug) console.log('Request body:', body);
        const { type, packId, amount, returnUrl, cancelUrl } = body;
        let userId = null;
        
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
          if (debug) console.log('Auth header present, verifying user');
          const userSupabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader } } }
          );
          const { data: { user }, error: authError } = await userSupabase.auth.getUser();
          if (debug) console.log('Supabase getUser result:', user, authError);
          userId = user?.id || null;
        }

        if (!userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        let metadata: any = {
          user_id: userId,
          type: type,
        };

        const GEL_PACKS: Record<string, { name: string; price: number; gelCount: number }> = {
          ping: { name: 'Pack PING', price: 0.99, gelCount: 1 },
          reboot: { name: 'Pack REBOOT', price: 2.49, gelCount: 3 },
          afk: { name: 'Pack AFK', price: 3.99, gelCount: 5 },
          overclock: { name: 'Pack OVERCLOCK', price: 6.99, gelCount: 10 },
        };

        if (type === 'donation') {
          if (!amount || amount < 2) {
            return new Response(JSON.stringify({ error: 'Donation must be at least 2€' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: { name: 'Donation Ekloud' },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          });
          metadata.amount = amount.toString();
        } else if (type === 'gel_pack') {
          if (!packId || !GEL_PACKS[packId]) {
            return new Response(JSON.stringify({ error: 'Invalid pack ID' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const pack = GEL_PACKS[packId];
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: { name: pack.name },
              unit_amount: Math.round(pack.price * 100),
            },
            quantity: 1,
          });
          metadata.pack_id = packId;
          metadata.gel_count = pack.gelCount.toString();
        } else if (type === 'streak_recovery') {
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: { name: 'Récupération de streak' },
              unit_amount: 199,
            },
            quantity: 1,
          });
        } else {
          return new Response(JSON.stringify({ error: 'Invalid type' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (debug) console.log('Creating Stripe checkout session');
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: returnUrl || `${env.SUPABASE_URL}/`,
          cancel_url: cancelUrl || `${env.SUPABASE_URL}/`,
          metadata: metadata,
        });

        if (debug) console.log('Stripe session created:', session.id);
        if (debug) console.log('Creating transaction in Supabase');
        await supabase.from('transactions').insert({
          user_id: userId,
          type: type,
          amount: type === 'donation' ? amount : (type === 'gel_pack' ? GEL_PACKS[packId].price : 1.99),
          stripe_checkout_session_id: session.id,
          metadata: metadata,
          status: 'pending',
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('=== Unhandled error ===');
      console.error('Error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
