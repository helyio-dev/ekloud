-- Script SQL pour ajouter le rôle de 'contributor' (Contributeur)

-- 1. Mettre à jour la contrainte des rôles acceptés pour accepter 'contributor'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'contributor'));

-- 2. Créer une fonction is_contributor() qui retourne true pour un admin OU un contributeur
CREATE OR REPLACE FUNCTION public.is_contributor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'contributor')
  );
$$;

-- 3. Ajouter les politiques de sécurité (RLS) pour autoriser les contributeurs à gérer le contenu
CREATE POLICY "Les contributeurs peuvent gérer les modules" ON public.modules AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les leçons" ON public.lessons AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les questions" ON public.questions AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les quiz_options" ON public.quiz_options AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les réponses" ON public.answers AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les skills" ON public.skills AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les skill_modules" ON public.skill_modules AS PERMISSIVE FOR ALL USING (is_contributor());
CREATE POLICY "Les contributeurs peuvent gérer les skill_prerequisites" ON public.skill_prerequisites AS PERMISSIVE FOR ALL USING (is_contributor());
