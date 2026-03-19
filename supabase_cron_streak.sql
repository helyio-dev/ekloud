-- Ce script met en place une tâche cron Supabase pour réinitialiser les streaks expirés.

-- 1. Activer l'extension pg_cron (peut nécessiter d'être fait depuis le dashboard Supabase : Database > Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Créer la fonction de vérification et de remise à zéro
CREATE OR REPLACE FUNCTION public.reset_expired_streaks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Les streaks expirent si last_streak_at est plus vieux de 48 heures.
  -- Cela correspond exactement à la logique utilisée côté frontend.
  UPDATE public.profiles
  SET streak = 0
  WHERE streak > 0 
    AND (
      last_streak_at IS NULL 
      OR last_streak_at < timezone('utc', now()) - interval '48 hours'
    );
END;
$$;

-- 3. Planifier la tâche avec pg_cron (tous les jours à minuit UTC)
-- S'il y a déjà une tâche avec le même nom, on peut d'abord la retirer :
-- SELECT cron.unschedule('reset-streaks-midnight');

SELECT cron.schedule(
    'reset-streaks-midnight',  -- Nom du job
    '0 0 * * *',               -- A minuit tous les jours (cron syntax)
    $$ SELECT public.reset_expired_streaks(); $$
);
