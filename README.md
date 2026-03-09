# Ekloud Project Documentation

## 1. Présentation du projet

**Nom du projet :** Ekloud

**Slogan :** Level up your tech knowledge.

### Concept

Ekloud est une plateforme d’apprentissage en ligne dédiée aux **technologies informatiques**.

L’apprentissage est organisé sous forme de **modules progressifs** composés de :

- leçons
- quiz
- examen final

La progression est **séquentielle** : un utilisateur doit réussir l’examen final d’un module pour débloquer le module suivant.

L’objectif est de proposer une plateforme :

- structurée
- accessible gratuitement
- centrée sur la progression et la validation des connaissances

---

## 2. Objectifs du produit

La plateforme doit permettre de :

- proposer un **apprentissage structuré des technologies**
- permettre aux utilisateurs de **suivre leur progression**
- valider les connaissances via **quiz et examens**
- encourager la motivation via **une progression claire**

La première version correspond à un **MVP (Minimum Viable Product)**.

---

## 3. Public cible

Les utilisateurs principaux sont :

- étudiants en informatique
- autodidactes
- débutants en programmation
- personnes souhaitant renforcer leurs bases techniques

Niveau ciblé :

```
débutant → intermédiaire
```

---

## 4. Système d’apprentissage

La plateforme repose sur un **système de progression par modules**.

Ordre de progression :

```
Leçons → Quiz → Examen final → Déblocage du module suivant
```

Règles :

- toutes les leçons doivent être complétées pour accéder au quiz
- le quiz doit être réussi pour accéder à l’examen
- l’examen doit être réussi pour débloquer le module suivant

Le premier module est **toujours accessible**.

---

## 5. Structure pédagogique

### Modules

Un module représente un **sujet d’apprentissage**.

Exemple :

```
Module : HTML
```

Structure d’un module :

```
Module
 ├ Leçon 1
 ├ Leçon 2
 ├ Leçon 3
 ├ Quiz
 └ Examen final
```

Chaque module contient :

- plusieurs leçons
- un quiz
- un examen final

Les modules sont **ordonnés via un index de progression**.

---

### Leçons

Une leçon contient le contenu pédagogique.

Champs principaux :

- titre
- contenu texte
- exemples
- éventuellement images
- éventuellement extraits de code

Les leçons sont affichées dans **un ordre linéaire**.

---

### Quiz

Le quiz sert à vérifier la compréhension des leçons.

Caractéristiques :

- questions sélectionnées aléatoirement
- tirées depuis une banque de questions
- nombre fixe de questions

Exemple :

```
Banque de questions : 50
Quiz : 10 questions tirées aléatoirement
```

Score minimum pour réussir :

```
70 %
```

---

### Examen final

L’examen valide la maîtrise du module.

Caractéristiques :

- questions aléatoires
- plus de questions que le quiz
- difficulté plus élevée

Exemple :

```
Banque de questions : 80
Examen : 20 questions
```

Score minimum pour réussir :

```
80 %
```

Si l’examen est réussi :

```
le module suivant est débloqué
```

---

## 6. Fonctionnalités principales (MVP)

### Authentification

Les utilisateurs doivent pouvoir :

- créer un compte
- se connecter
- se déconnecter
- réinitialiser leur mot de passe

Méthode :

```
email + mot de passe
```

L’authentification est gérée par **Supabase Auth**.

---

### Profil utilisateur

Chaque utilisateur possède un profil contenant :

- date d’inscription
- progression d’apprentissage
- modules complétés
- scores aux examens

---

### Progression utilisateur

La plateforme doit suivre :

- les leçons complétées
- les quiz réalisés
- les examens réalisés
- les modules débloqués
- les modules complétés

---

### Système de déblocage

Un module est débloqué si :

```
l’examen du module précédent est réussi
```

Le premier module est automatiquement débloqué.

---

## 7. Liste initiale des modules

### Programmation

```
HTML
CSS
JavaScript
Python
C
C++
C#
```

---

### Systèmes

```
Linux
Windows
Windows Server
```

---

### Cybersécurité

```
Bases de cybersécurité
OSINT
VPN
Proxy
```

---

### Infrastructure

```
RAID 0
RAID 1
RAID 5
RAID 6
NAS
```

Les modules sont regroupés par **catégories**.

---

## 8. Stack technique

### Frontend

Technologies utilisées :

```
Next.js
React
TailwindCSS
```

Contraintes :

- interface responsive
- navigation simple
- chargement rapide

---

### Backend

Service backend :

```
Supabase
```

Utilisé pour :

- base de données PostgreSQL
- authentification
- API
- sécurité (Row Level Security)

---

### Hébergement

Déploiement frontend :

```
Vercel
ou
Netlify
```

---



## 10. Logique des quiz

Lorsqu’un utilisateur lance un quiz :

1. sélectionner des questions aléatoires depuis la banque de questions
2. afficher les réponses associées
3. calculer le score :

```
score = bonnes réponses / nombre total de questions
```

Le quiz est réussi si :

```
score ≥ 70 %
```
---

## 11. Logique des examens

Le fonctionnement est identique au quiz.

Différences :

```
plus de questions
difficulté plus élevée
```

Condition de réussite :

```
score ≥ 80 %
```

Si l’examen est réussi :

```
le module suivant est débloqué
```

---

## 12. Pages principales de l’application

### Page d’accueil

Contient :

- présentation de la plateforme
- explication du système d’apprentissage
- bouton d’inscription

---

### Dashboard

Page principale après connexion.

Affiche :

- modules disponibles
- modules verrouillés
- progression utilisateur

---

### Page module

Affiche :

- description du module
- liste des leçons
- accès au quiz
- accès à l’examen final

---

### Page leçon

Affiche :

- titre de la leçon
- contenu pédagogique
- navigation vers la leçon suivante

---

### Page quiz

Affiche :

- questions
- réponses possibles
- validation des réponses

---

### Page examen

Similaire à la page quiz.

Contient simplement **plus de questions**.

---

## 13. Interface utilisateur (UI)

Le design doit suivre un **style sombre moderne**, mais sans utiliser les stéréotypes visuels du monde hacker.

Principes :

- thème sombre
- interface minimaliste
- forte lisibilité
- hiérarchie visuelle claire

Palette suggérée :

```
fond : gris très sombre
surfaces : gris foncé
accent principal : bleu ou violet doux
texte : gris clair
```