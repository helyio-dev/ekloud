# Projet : Plateforme d’apprentissage gratuite “Tech pour tous”

---

## 1. Objectif du projet

- Plateforme web gratuite pour apprendre le développement et la tech (cybersécurité, web, Python, etc.)  
- Accessible à tous les niveaux mais conçue pour **débutants structurés**  
- Contenu rédigé uniquement par le créateur  
- Gamification simple : XP, niveaux, badges, barre de progression  
- Modules libres mais progression **linéaire dans chaque module**  
- Pas de certification officielle, apprentissage libre et responsable  
- UX/UI moderne, clean, lisible, hors clichés “geek / cyberpunk”  

---

## 2. Modules & contenu (MVP)

### Modules proposés (3 modules max)

| Module | Leçons | Objectif | Quiz |
|--------|--------|----------|-----|
| Bases Web | 6–8 | HTML / CSS | QCM + réponses multiples |
| Python | 6–8 | Syntaxe, variables, boucles, fonctions | QCM + réponses multiples |
| Intro cybersécurité | 6–8 | Concepts défensifs, éthique, mythes du dark web | QCM + réponses multiples |

> [!NOTE]
> D'autres modules seront proposés plus tard 

### Structure d’une leçon

1. Contenu écrit / illustration  
2. Bouton “Valider la lecture”  
3. Mini-question obligatoire pour validation lecture → XP lecture  
4. Quiz final → XP quiz, questions aléatoires depuis banque  

---

## 3. Gamification

### XP

| Action | Difficulté | XP |
|--------|------------|----|
| Lecture validée | Facile | 2 |
| Lecture validée | Moyen | 3 |
| Lecture validée | Difficile | 5 |
| Quiz réussi | Facile | 10 |
| Quiz réussi | Moyen | 25 |
| Quiz réussi | Difficile | 50 |

**Conditions :**  
- Lecture → mini QCM  
- Quiz → score ≥70% pour valider XP  
- XP unique par leçon et quiz  
- Barre de progression par module  
- Badge final module  

### Niveaux utilisateur

- **Level = floor(total_xp / 100)**  
- Optionnel : XP progressive exponentielle pour niveaux supérieurs  
- Dashboard : total XP, niveau, badges, progression par module  

---

## 4. Logique de progression

- Modules libres d’accès → tous visibles dès le départ  
- Progression linéaire dans module : Leçon N accessible seulement si Leçon N-1 validée  
- Quiz générés aléatoirement depuis banque de 15–20 questions  
- Tentatives illimitées, pas de blocage agressif  
- Timer et suivi basique pour UX  

---

## 5. Tables de base de données

### users

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| username | VARCHAR | Unique |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | Sécurisé |
| total_xp | INT | Total XP accumulé |
| level | INT | Niveau actuel |
| created_at | DATETIME | |

### modules

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| title | VARCHAR | Nom du module |
| description | TEXT | |

### lessons

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| module_id | INT FK | module.id |
| title | VARCHAR | Nom de la leçon |
| content | TEXT | Contenu principal |
| order_index | INT | Ordre dans module |
| difficulty | INT | 1=Facile,2=Moyen,3=Difficile |
| xp_value | INT | XP quiz, calcul automatique |

### quizzes

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| lesson_id | INT FK | lessons.id |
| title | VARCHAR | Nom du quiz |

### questions

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| quiz_id | INT FK | quizzes.id |
| question_text | TEXT | |
| type | ENUM | single / multiple |
| difficulty | INT | 1–3 |
| explanation | TEXT | optionnel |

### answers

| Champ | Type | Notes |
|-------|------|------|
| id | INT PK | Auto-increment |
| question_id | INT FK | questions.id |
| answer_text | TEXT | |
| is_correct | BOOL | |

### user_lesson_progress

| Champ | Type | Notes |
|-------|------|------|
| user_id | INT FK | users.id |
| lesson_id | INT FK | lessons.id |
| lecture_validated | BOOL | mini QCM validé |
| quiz_validated | BOOL | quiz validé |
| xp_earned | INT | |

### user_quiz_attempts

| Champ | Type | Notes |
|-------|------|------|
| user_id | INT FK | users.id |
| quiz_id | INT FK | quizzes.id |
| score | INT | pour suivi statistique |
| started_at | DATETIME | |
| finished_at | DATETIME | |

---

## 6. Flux utilisateur (lecture → XP → quiz)

1. Ouvre le module → liste leçons  
2. Clique sur une leçon → lecture  
3. Bouton “Valider lecture”  
4. Mini-question → si bonne réponse → XP lecture  
5. Lance quiz → questions aléatoires depuis banque  
6. Score ≥ 70% → XP quiz attribué  
7. Total XP mis à jour → level recalculé  
8. Progression et badges affichés sur dashboard  

---

## 7. UX/UI Design

- Style moderne, épuré, hors clichés tech  
- Typographie : Inter, Roboto ou Poppins  
- Palette : 2–3 couleurs douces + neutres (bleu clair / vert pastel / gris)  
- Barre progression visible  
- Badges minimalistes  
- Feedback positif simple (“Bravo ! 25 XP gagnés”)  
- Menu clair : Modules → Leçons → Quiz → Dashboard  
- Responsive / mobile-friendly  

---

## 8. Tech stack recommandée

- Frontend : HTML + CSS + JS (ou TailwindCSS pour rapidité et design moderne)  
- Framework optionnel : React ou Vue (modularité)  
- Backend : PHP / Node.js / Ruby (standard BTS)  
- Base de données : MySQL / PostgreSQL  
- Hébergement gratuit : Vercel (Frontend) + Railway / Render (Backend + DB)  

---

## 9. Sécurité / éthique

- Pas de surveillance intrusive → UX positive  
- Contenu cybersécurité → éthique et défensif uniquement  
- Pas de certification officielle → apprentissage libre  
- Passwords sécurisés (hash + salt)  

---

## 10. Plan MVP / roadmap

### Phase 1 — 1–2 mois
- Cahier des charges détaillé  
- Maquettes UI (Figma)  
- Choix tech stack  

### Phase 2 — 3–5 mois
- Authentification / DB  
- Création modules + leçons  
- Logiciel de progression simple  
- Dashboard utilisateur  

### Phase 3 — 6–8 mois
- Quiz aléatoire  
- XP + badges  
- Progression linéaire par module  

### Phase 4 — 9–12 mois
- Sécurisation minimum  
- Optimisation UI/UX  
- Tests finaux  
- Documentation complète (BTS-ready)  