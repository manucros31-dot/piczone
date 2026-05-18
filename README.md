# PIKZONE 🦟

Application mobile PWA de signalement collaboratif de moustiques en temps réel.  
Stack : **React 19 + Vite · react-leaflet · Supabase · PWA**

---

## Fonctionnalités

### Carte
- Carte Leaflet interactive centrée sur la France
- **Géolocalisation GPS** : centrage initial unique sur l'utilisateur, déplacement libre ensuite
- **Retour automatique** : après 5 secondes d'inactivité, la carte revient doucement sur la position GPS (`flyTo`)
- **Bouton 📍** : recentrage manuel immédiat, pulse quand l'utilisateur est éloigné
- Clustering spatial des signalements (rayon 50 m)
- Zones colorées par niveau d'infestation :
  - 🔴 Rouge — Infesté
  - 🟠 Orange — Beaucoup
  - 🟡 Jaune — Peu
  - 🟢 Vert — Aucun

### Signalement
- Bouton central `🦟` actif **uniquement si la carte est centrée sur la position GPS** (tolérance 50 m)
- Bouton grisé `🔒` si l'utilisateur est trop éloigné, avec toast explicatif
- Sauvegarde en base Supabase avec identifiant anonyme ou compte utilisateur

### Planification — "Je planifie"
- Recherche d'adresse via Nominatim (OpenStreetMap)
- Sélection d'une date précise ou d'une période
- Filtrage des signalements historiques par zone (200 m) et par mois
- Affichage du niveau moyen sur la période choisie
- Disclaimer légal visible à l'étape de recherche, masqué à l'étape suivante

### Données officielles
- Toggle `👁️ Officiel ON/OFF` : affiche les événements officiels (démoustication, alertes dengue, etc.)
- Intégration **Mosquito Alert API** : observations validées de moustiques tigres en Europe
  - Cache sessionStorage 2 h
  - Filtre bbox Europe (−10/35/25/55)
- Bandeau d'alerte automatique si un événement de type `alerte_dengue / chikungunya / zika` est actif

### Authentification & profil
- Connexion / inscription via Supabase Auth
- Profil utilisateur et compteur de signalements
- Système de badges :
  - 🎖️ Guerre aux Moustiques — 1er signalement
  - 🛡️ Anti-Moustiques — 20 signalements
  - 💥 Moustique Destructeur — 40 signalements
- Upsell compte pour les utilisateurs anonymes après le premier signalement

### PWA
- Installable sur iOS et Android (`manifest.json` + Service Worker)
- Cache-first pour les assets (ignore Supabase et OpenStreetMap)
- Bannière d'installation différée (apparaît après 45 s, dismissable)
- BetaGate : accès protégé par mot de passe (`VITE_BETA_PASSWORD`)

### Administration
- Interface admin accessible sur `/admin` (mot de passe `VITE_ADMIN_PASSWORD`)
- Création / suppression d'événements officiels (type, titre, description, coordonnées, rayon, dates, source)
- Recherche d'adresse Nominatim intégrée

---

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| React | 19 | Interface utilisateur |
| Vite | 8 | Build et dev server |
| react-leaflet | 5 | Carte interactive |
| Leaflet | — | Moteur cartographique |
| @supabase/supabase-js | — | Base de données, Auth, API |
| @resvg/resvg-js | — | Génération des icônes PNG depuis SVG |

---

## Installation

```bash
# Cloner le projet
git clone https://github.com/manucros31-dot/piczone.git
cd pikzone

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les variables (voir section suivante)

# Lancer en développement
npm run dev
```

---

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_BETA_PASSWORD=PIKZONE2026
VITE_ADMIN_PASSWORD=ADMIN_PIKZONE2026
```

> **Important** : ne jamais committer le fichier `.env` (exclu par `.gitignore`)

---

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter [`supabase/schema.sql`](supabase/schema.sql) dans l'éditeur SQL
3. Copier l'URL et la clé `anon` dans `.env`

### Tables

| Table | Description |
|-------|-------------|
| `signalements` | Signalements communautaires (lat, lng, niveau, user_id, auth_user_id) |
| `profiles` | Profils utilisateurs liés à Supabase Auth |
| `official_events` | Événements officiels créés via l'admin |

---

## Structure du projet

```
src/
├── components/
│   ├── Map.jsx            # Carte Leaflet + GPS + clustering + données officielles
│   ├── ReportModal.jsx    # Formulaire de signalement
│   ├── Badges.jsx         # Page des badges
│   ├── BottomNav.jsx      # Barre de navigation (avec état isNearGPS)
│   ├── PlanModal.jsx      # Modale "Je planifie" (2 étapes)
│   ├── AuthModal.jsx      # Connexion / inscription
│   ├── Profile.jsx        # Page profil
│   ├── AdminPage.jsx      # Interface admin (/admin)
│   ├── AlertBanner.jsx    # Bandeau alerte automatique
│   ├── BetaGate.jsx       # Portail d'accès beta
│   └── InstallBanner.jsx  # Bannière d'installation PWA
├── hooks/
│   ├── useGeolocation.js  # Hook GPS (watchPosition)
│   └── useAuth.js         # Hook session Supabase Auth
├── lib/
│   ├── supabase.js        # Client Supabase + identifiant anonyme (localStorage)
│   ├── geo.js             # haversineM, scoreToColor, scoreToLabel, getMonthsForRange
│   └── officialData.js    # EVENT_TYPES, isActiveEvent, fetchMosquitoAlertData
├── App.jsx                # Orchestrateur principal
└── App.css                # Styles globaux (mobile-first)
public/
├── manifest.json          # Manifeste PWA
├── sw.js                  # Service Worker (cache-first)
└── icons/                 # icon.svg + 8 tailles PNG
scripts/
└── gen-icons.mjs          # Génération des icônes PNG depuis icon.svg
supabase/
└── schema.sql             # Schéma complet de la base de données
```

---

## Scripts

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
node scripts/gen-icons.mjs  # Régénérer les icônes PWA
```

---

## Comportement GPS — détail technique

Le composant `MapController` (interne à `Map.jsx`) gère l'intégralité de la logique GPS :

```
1. Premier fix GPS reçu → flyTo(position, zoom=15, duration=1.5s)  [une seule fois]
2. Utilisateur déplace la carte → annulation du timer
3. Fin de déplacement → démarrage timer 5s
4. Timer écoulé → flyTo(position, zoomActuel, duration=1.5s)
5. Clic bouton 📍 → annulation timer + flyTo immédiat
```

Le flag `isProgrammatic` empêche les mouvements déclenchés par `flyTo` de relancer le timer.

`isNearGPS` dans `App.jsx` = `haversineM(centreVue, GPS) ≤ 50 m`  
→ contrôle l'état actif/grisé du bouton Signaler.

---

## Déploiement

Le projet est déployé automatiquement sur **Vercel** à chaque push sur `main`.  
Les variables d'environnement sont configurées dans le dashboard Vercel.
