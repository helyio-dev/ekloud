CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
    ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='level') THEN
    ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak') THEN
    ALTER TABLE public.profiles ADD COLUMN streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_streak_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_streak_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create a secure function to check admin status (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;
CREATE POLICY "Les profils sont visibles par tous" ON public.profiles FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  prerequisite_id UUID REFERENCES public.modules(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tout le monde peut lire les modules" ON public.modules;
CREATE POLICY "Tout le monde peut lire les modules" ON public.modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les admins peuvent gérer les modules" ON public.modules;
CREATE POLICY "Les admins peuvent gérer les modules" ON public.modules FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='difficulty') THEN
    ALTER TABLE public.lessons ADD COLUMN difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard'));
  END IF;
END $$;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tout le monde peut lire les leçons" ON public.lessons;
CREATE POLICY "Tout le monde peut lire les leçons" ON public.lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les admins peuvent gérer les leçons" ON public.lessons;
CREATE POLICY "Les admins peuvent gérer les leçons" ON public.lessons FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
  type TEXT DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='difficulty') THEN
    ALTER TABLE public.questions ADD COLUMN difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard'));
  END IF;
END $$;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tout le monde peut lire les questions" ON public.questions;
CREATE POLICY "Tout le monde peut lire les questions" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les admins peuvent gérer les questions" ON public.questions;
CREATE POLICY "Les admins peuvent gérer les questions" ON public.questions FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tout le monde peut lire les réponses" ON public.answers;
CREATE POLICY "Tout le monde peut lire les réponses" ON public.answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les admins peuvent gérer les réponses" ON public.answers;
CREATE POLICY "Les admins peuvent gérer les réponses" ON public.answers FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  unlocked BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, module_id)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_modules_updated_at ON public.user_modules;
CREATE TRIGGER trg_user_modules_updated_at
BEFORE UPDATE ON public.user_modules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  is_exam BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_attempts' AND column_name='is_exam') THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN is_exam BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs lisent leurs modules" ON public.user_modules;
CREATE POLICY "Les utilisateurs lisent leurs modules" ON public.user_modules FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs lisent leurs leçons" ON public.user_lessons;
CREATE POLICY "Les utilisateurs lisent leurs leçons" ON public.user_lessons FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs gèrent leurs leçons" ON public.user_lessons;
CREATE POLICY "Les utilisateurs gèrent leurs leçons" ON public.user_lessons FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs mettent a jour leurs leçons" ON public.user_lessons;
CREATE POLICY "Les utilisateurs mettent a jour leurs leçons" ON public.user_lessons FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs lisent leurs tentatives" ON public.quiz_attempts;
CREATE POLICY "Les utilisateurs lisent leurs tentatives" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs inserent leurs tentatives" ON public.quiz_attempts;
CREATE POLICY "Les utilisateurs inserent leurs tentatives" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs lisent leurs badges" ON public.user_badges;
CREATE POLICY "Les utilisateurs lisent leurs badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs voient leurs modules" ON public.user_modules;
CREATE POLICY "Les utilisateurs voient leurs modules" ON public.user_modules FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Les utilisateurs insèrent leurs modules" ON public.user_modules;
CREATE POLICY "Les utilisateurs insèrent leurs modules" ON public.user_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Les utilisateurs mettent à jour leurs modules" ON public.user_modules;
CREATE POLICY "Les utilisateurs mettent à jour leurs modules" ON public.user_modules FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, username)
  VALUES (new.id, new.email, 'student', new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_id2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_friendship UNIQUE (user_id1, user_id2),
  CONSTRAINT no_self_friendship CHECK (user_id1 != user_id2)
);

CREATE INDEX IF NOT EXISTS friendships_user_id1_idx ON public.friendships(user_id1);
CREATE INDEX IF NOT EXISTS friendships_user_id2_idx ON public.friendships(user_id2);

CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS user_modules_user_id_idx ON public.user_modules(user_id);
CREATE INDEX IF NOT EXISTS user_lessons_user_id_idx ON public.user_lessons(user_id);
CREATE INDEX IF NOT EXISTS lessons_module_id_idx ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS questions_module_id_idx ON public.questions(module_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres amitiés" ON public.friendships;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres amitiés" ON public.friendships FOR SELECT 
USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

DROP POLICY IF EXISTS "Les utilisateurs peuvent envoyer des demandes d'amis" ON public.friendships;
CREATE POLICY "Les utilisateurs peuvent envoyer des demandes d'amis" ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id1);

DROP POLICY IF EXISTS "Les utilisateurs peuvent accepter ou refuser des demandes" ON public.friendships;
CREATE POLICY "Les utilisateurs peuvent accepter ou refuser des demandes" ON public.friendships FOR UPDATE 
USING (auth.uid() = user_id1 OR auth.uid() = user_id2)
WITH CHECK (auth.uid() = user_id1 OR auth.uid() = user_id2);

DROP POLICY IF EXISTS "Les utilisateurs peuvent annuler ou supprimer une amitié" ON public.friendships;
CREATE POLICY "Les utilisateurs peuvent annuler ou supprimer une amitié" ON public.friendships FOR DELETE 
USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

DROP POLICY IF EXISTS "Les admins suppriment les profils" ON public.profiles;
CREATE POLICY "Les admins suppriment les profils" ON public.profiles FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Les admins lisent tous les profils" ON public.profiles;
-- We don't need a separate admin policy here if we have a "visibles par tous" or a owner policy.
-- But let's keep it clean.
CREATE POLICY "Les admins lisent tous les profils" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Les admins lisent tous les user_modules" ON public.user_modules;
CREATE POLICY "Les admins lisent tous les user_modules" ON public.user_modules FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Les admins suppriment les user_modules" ON public.user_modules;
CREATE POLICY "Les admins suppriment les user_modules" ON public.user_modules FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Les admins lisent tous les user_lessons" ON public.user_lessons;
CREATE POLICY "Les admins lisent tous les user_lessons" ON public.user_lessons FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Les admins suppriment les user_lessons" ON public.user_lessons;
CREATE POLICY "Les admins suppriment les user_lessons" ON public.user_lessons FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Les admins lisent tous les quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Les admins lisent tous les quiz_attempts" ON public.quiz_attempts FOR SELECT USING (public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='clan') THEN
    ALTER TABLE public.profiles ADD COLUMN clan TEXT CHECK (clan IN ('ROOT', 'VOID', 'CORE', 'CYPHER'));
  END IF;
END $$;

DROP POLICY IF EXISTS "Les utilisateurs peuvent définir leur clan" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent définir leur clan" ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name
    x_pos INTEGER DEFAULT 0,
    y_pos INTEGER DEFAULT 0,
    is_final BOOLEAN DEFAULT false,
    requires_exam BOOLEAN DEFAULT false,
    exam_module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='exam_module_id') THEN
    ALTER TABLE public.skills ADD COLUMN exam_module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='is_locked') THEN
    ALTER TABLE public.skills ADD COLUMN is_locked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Skill Prerequisites (for the tree structure)
CREATE TABLE IF NOT EXISTS public.skill_prerequisites (
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    prerequisite_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, prerequisite_skill_id)
);

-- Skill Modules (modules required to complete a skill)
CREATE TABLE IF NOT EXISTS public.skill_modules (
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, module_id)
);

-- User Skills (mastered skills)
CREATE TABLE IF NOT EXISTS public.user_skills (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, skill_id)
);

-- RLS for Skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Skills are manageable by admins" ON public.skills;
CREATE POLICY "Skills are manageable by admins" ON public.skills FOR ALL USING (public.is_admin());

-- RLS for Skill Prerequisites
ALTER TABLE public.skill_prerequisites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skill prerequisites are viewable by everyone" ON public.skill_prerequisites;
CREATE POLICY "Skill prerequisites are viewable by everyone" ON public.skill_prerequisites FOR SELECT USING (true);
DROP POLICY IF EXISTS "Skill prerequisites are manageable by admins" ON public.skill_prerequisites;
CREATE POLICY "Skill prerequisites are manageable by admins" ON public.skill_prerequisites FOR ALL USING (public.is_admin());

-- RLS for Skill Modules
ALTER TABLE public.skill_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skill modules are viewable by everyone" ON public.skill_modules;
CREATE POLICY "Skill modules are viewable by everyone" ON public.skill_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Skill modules are manageable by admins" ON public.skill_modules;
CREATE POLICY "Skill modules are manageable by admins" ON public.skill_modules FOR ALL USING (public.is_admin());

-- RLS for User Skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User skills are viewable by the user" ON public.user_skills;
CREATE POLICY "User skills are viewable by the user" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User skills can be inserted by the user" ON public.user_skills;
CREATE POLICY "User skills can be inserted by the user" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User skills are viewable by admins" ON public.user_skills;
CREATE POLICY "User skills are viewable by admins" ON public.user_skills FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
