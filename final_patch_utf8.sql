[dotenv@17.3.1] injecting env (2) from .env -- tip: ­ƒöÉ prevent building .env in docker: https://dotenvx.com/prebuild
-- SQL PATCH FOR ACHIEVEMENTS AND UNLOCKING

-- 1. Map Skills to Modules

-- 2. Retroactive Completion

-- 3. Retroactive Unlocking for dependent modules
-- This handles cases where a prerequisite was finished but the next wasn't unlocked
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id, module_id FROM public.user_modules WHERE completed = true
  LOOP
    INSERT INTO public.user_modules (user_id, module_id, unlocked, completed)
    SELECT r.user_id, id, true, false FROM public.modules WHERE prerequisite_id = r.module_id
    ON CONFLICT (user_id, module_id) DO UPDATE SET unlocked = true;
  END LOOP;
END $$;
