# 🏛️ Plateforme Numérique de Recouvrement des Recettes Municipales

> Architecture Microservices | Express.js (ESM) | PostgreSQL | Sequelize | Nodemon | Docker

---

## 📐 Architecture Globale

```
┌──────────────────────────────────────────────────────────────────────┐
│                        INTERNET / CLIENTS                            │
│         (Navigateur, Application Mobile, Trésor Public, DGI)        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTPS (Port 443)
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy + SSL)                       │
│              Rate Limiting | SSL Termination | Sécurité              │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTP interne (Port 3000)
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│              🚦 PASSERELLE API (API Gateway)                         │
│         Routage | Auth JWT | Rate Limiting | Proxy HTTP              │
│                   passerelle/serveur.js                              │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
 3001   3002   3003   3004   3005   3006   3007
  🔐     👤     💰     💳     🔍     📊     🔔
AUTH   CONT   RECT   PAIE   RECO   TABL   NOTI
IFIC   RIBU   TTES   MENT   VREM   EAUX   FICA
ATIO   ABLES        S      ENT    BORD   TION
  N                                      S

   └──────────────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       🐘 PostgreSQL         🔴 Redis
      (Base de données)     (Cache/Sessions)
         Port 5432            Port 6379
```

---

## 📁 Structure Complète des Fichiers

```
recouvrement-municipal/
│
├── 📄 package.json                          # Dépendances globales (workspaces)
├── 📄 .env.exemple                          # Variables d'environnement (modèle)
├── 📄 README.md                             # Documentation principale
│
├── 📂 passerelle/                           # 🚦 API Gateway (point d'entrée unique)
│   └── serveur.js                          # Proxy HTTP vers les microservices
│
├── 📂 services/                             # 🏗️ Microservices métier
│   │
│   ├── 📂 authentification/                 # 🔐 Service Auth (Port 3001)
│   │   └── 📂 src/
│   │       ├── application.js              # Point d'entrée Express
│   │       ├── 📂 modeles/
│   │       │   ├── Utilisateur.js          # Modèle Sequelize Utilisateur
│   │       │   ├── JournalAudit.js         # Modèle logs d'audit
│   │       │   └── index.js               # Export + synchronisation BD
│   │       ├── 📂 services/
│   │       │   └── serviceAuthentification.js  # Logique métier connexion/inscription
│   │       ├── 📂 controleurs/
│   │       │   └── contrôleurAuthentification.js
│   │       ├── 📂 routes/
│   │       │   ├── routesAuthentification.js   # POST /connexion, /inscription
│   │       │   └── routesUtilisateurs.js       # GET/PUT /utilisateurs
│   │       ├── 📂 middlewares/             # Middlewares spécifiques au service
│   │       ├── 📂 validateurs/             # Schémas de validation Joi
│   │       ├── 📂 tests/                   # Tests unitaires
│   │       └── 📂 config/                  # Configuration du service
│   │
│   ├── 📂 contribuables/                    # 👤 Service Contribuables (Port 3002)
│   │   └── 📂 src/
│   │       ├── application.js
│   │       ├── 📂 modeles/
│   │       │   ├── Contribuable.js         # NIF, catégorie, coordonnées
│   │       │   └── index.js
│   │       ├── 📂 services/
│   │       ├── 📂 controleurs/
│   │       ├── 📂 routes/
│   │       │   └── routesContribuables.js  # CRUD + recherche avancée
│   │       ├── 📂 middlewares/
│   │       ├── 📂 validateurs/
│   │       └── 📂 tests/
│   │
│   ├── 📂 recettes/                         # 💰 Service Recettes (Port 3003)
│   │   └── 📂 src/
│   │       ├── application.js
│   │       ├── 📂 modeles/
│   │       │   ├── TypeTaxe.js             # Paramétrage taxes et tarifs
│   │       │   ├── Facture.js              # Émission + calcul pénalités
│   │       │   └── index.js
│   │       ├── 📂 services/
│   │       ├── 📂 controleurs/
│   │       ├── 📂 routes/
│   │       │   ├── routesTypesTaxes.js     # CRUD types de taxes
│   │       │   └── routesFactures.js       # Émission, lot, mise à jour statut
│   │       ├── 📂 middlewares/
│   │       └── 📂 validateurs/
│   │
│   ├── 📂 paiements/                        # 💳 Service Paiements (Port 3004)
│   │   └── 📂 src/
│   │       ├── application.js
│   │       ├── 📂 modeles/
│   │       │   ├── Paiement.js             # Mobile Money, virement, guichet
│   │       │   ├── Quittance.js            # QR code, signature numérique
│   │       │   └── index.js
│   │       ├── 📂 services/
│   │       │   └── servicePaiement.js      # Intégration Mobile Money, génération quittance
│   │       ├── 📂 controleurs/
│   │       ├── 📂 routes/
│   │       │   ├── routesPaiements.js      # Mobile Money, guichet, confirmation
│   │       │   ├── routesQuittances.js     # Consultation, vérification
│   │       │   └── routesWebhooks.js       # Callback opérateurs paiement
│   │       └── 📂 middlewares/
│   │
│   ├── 📂 recouvrement/                     # 🔍 Service Recouvrement (Port 3005)
│   │   └── 📂 src/
│   │       ├── application.js              # + CRON jobs automatiques
│   │       ├── 📂 modeles/
│   │       │   ├── Relance.js              # SMS, Email, WhatsApp, Courrier
│   │       │   ├── Injonction.js           # Injonctions de payer judiciaires
│   │       │   └── index.js
│   │       ├── 📂 services/
│   │       │   └── serviceRelance.js       # Twilio, Nodemailer, Meta WhatsApp
│   │       ├── 📂 controleurs/
│   │       └── 📂 routes/
│   │           ├── routesRelances.js       # Relances manuelles + auto
│   │           └── routesInjonctions.js    # Création, suivi judiciaire
│   │
│   ├── 📂 tableaux-de-bord/                 # 📊 Service Dashboards (Port 3006)
│   │   └── 📂 src/
│   │       ├── application.js
│   │       └── 📂 routes/
│   │           ├── routesMairie.js         # KPI, prévisions, rapport mensuel
│   │           ├── routesTrésor.js         # Encaissements, journal comptable
│   │           ├── routesCitoyen.js        # Situation fiscale personnelle
│   │           └── routesRégie.js          # Performance agents, impayés
│   │
│   └── 📂 notifications/                    # 🔔 Service Notifications (Port 3007)
│       └── 📂 src/
│           └── application.js
│
├── 📂 partagé/                              # 🔗 Code commun à tous les services
│   ├── 📂 modeles/
│   │   └── configurationBD.js              # Instance Sequelize + connecterBD()
│   ├── 📂 middlewares/
│   │   ├── authentification.js             # JWT, RÔLES, vérifierToken()
│   │   └── gestionErreurs.js              # ErreurApplication, ErreurValidation
│   ├── 📂 utilitaires/
│   │   ├── journalisation.js              # Winston logger + journaliserAudit()
│   │   └── réponses.js                    # répondreSuccès(), répondreErreur()
│   └── 📂 constantes/                      # Constantes métier partagées
│
└── 📂 infrastructure/                       # ⚙️ Infrastructure & Déploiement
    ├── 📂 docker/
    │   ├── docker-compose.yml             # Orchestration de tous les services
    │   └── Dockerfile.service             # Image Docker Node.js sécurisée
    ├── 📂 nginx/
    │   └── nginx.conf                     # Reverse proxy HTTPS + rate limiting
    └── 📂 scripts/
        └── initialisation.sql             # Schéma SQL initial + vues + index
```

---

## 🔌 API Endpoints (via la Passerelle Port 3000)

### 🔐 Authentification
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/auth/connexion` | Public | Connexion utilisateur |
| POST | `/api/auth/inscription` | Public | Créer un compte |
| POST | `/api/auth/déconnexion` | Auth | Déconnexion |
| GET | `/api/auth/profil` | Auth | Profil de l'utilisateur connecté |

### 👤 Contribuables
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/api/contribuables` | Auth | Liste avec pagination et recherche |
| GET | `/api/contribuables/:id` | Auth | Détail d'un contribuable |
| GET | `/api/contribuables/identifiant/:nif` | Auth | Recherche par NIF |
| POST | `/api/contribuables` | Agent | Créer un contribuable |
| PUT | `/api/contribuables/:id` | Agent | Modifier un contribuable |
| DELETE | `/api/contribuables/:id` | Admin | Archiver (soft delete) |

### 💰 Recettes
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/api/types-taxes` | Auth | Liste des types de taxes |
| POST | `/api/types-taxes` | Admin | Créer un type de taxe |
| GET | `/api/factures` | Auth | Liste des factures |
| POST | `/api/factures` | Agent | Émettre une facture |
| POST | `/api/factures/lot` | Agent | Émission en lot |
| GET | `/api/factures/contribuable/:id` | Auth | Factures d'un contribuable |

### 💳 Paiements
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/paiements/mobile-money` | Auth | Initier paiement Mobile Money |
| POST | `/api/paiements/guichet` | Agent | Enregistrer paiement caisse |
| PATCH | `/api/paiements/:id/confirmer` | Trésor | Confirmer un paiement |
| GET | `/api/quittances/:numéro` | Auth | Récupérer une quittance |
| GET | `/api/quittances/vérifier/:code` | Public | Vérifier authenticité |
| POST | `/api/webhooks/mobile-money` | Public+HMAC | Callback opérateurs |

### 🔍 Recouvrement
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/relances/manuelle` | Agent | Envoyer une relance |
| POST | `/api/relances/déclencher-automatiques` | Admin | Déclencher CRON manuellement |
| POST | `/api/injonctions` | Admin/Mairie | Créer une injonction de payer |
| PATCH | `/api/injonctions/:id/statut` | Justice | Mettre à jour le statut |

### 📊 Tableaux de Bord
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/api/tableau-de-bord/mairie/vue-ensemble` | Mairie/Admin | KPI globaux |
| GET | `/api/tableau-de-bord/mairie/prévisions` | Mairie | Prévisions vs réalisé |
| GET | `/api/tableau-de-bord/trésor/encaissements` | Trésor | Journal des encaissements |
| GET | `/api/tableau-de-bord/trésor/journal-comptable` | Trésor | Journal journalier |
| GET | `/api/tableau-de-bord/citoyen/situation-fiscale` | Citoyen | Ma situation personnelle |
| GET | `/api/tableau-de-bord/régie/performance-agents` | Régie | Stats des agents |

---

## 🔑 Rôles et Permissions

| Rôle | Code | Accès |
|------|------|-------|
| Administrateur Système | `admin_système` | Accès total |
| Exécutif Mairie | `mairie_exécutif` | Dashboard + gestion taxes |
| Agent Financier | `agent_financier` | CRUD factures + paiements |
| Agent Régie | `agent_régie` | Contribuables + paiements guichet |
| Trésor Public | `trésor_public` | Journal comptable + encaissements |
| Tutelle | `tutelle` | Lecture tableaux de bord mairie |
| Justice | `justice` | Injonctions + contentieux |
| Citoyen | `citoyen` | Situation fiscale personnelle |
| Entreprise | `entreprise` | Idem citoyen |

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.exemple .env
# Éditer .env avec vos paramètres

# 3. Démarrer avec Docker (recommandé)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 4. OU démarrer en développement (services individuels)
npm run services:authentification &
npm run services:contribuables &
npm run services:recettes &
npm run services:paiements &
npm run services:recouvrement &
npm run services:tableaux-de-bord &
npm run dev   # Démarrer la passerelle

# 5. Vérifier que tout fonctionne
curl http://localhost:3000/sante/services
```

---

## 📦 Dépendances Principales

| Package | Rôle |
|---------|------|
| `express` | Framework HTTP des microservices |
| `sequelize` | ORM pour PostgreSQL |
| `pg` + `pg-hstore` | Driver PostgreSQL |
| `jsonwebtoken` | Authentification JWT |
| `bcryptjs` | Hachage des mots de passe |
| `http-proxy-middleware` | Proxy HTTP dans la passerelle |
| `nodemon` | Rechargement automatique en développement |
| `node-cron` | Tâches planifiées (relances, pénalités) |
| `twilio` | Envoi de SMS |
| `nodemailer` | Envoi d'emails |
| `axios` | Communication inter-services |
| `qrcode` | Génération de QR codes sur les quittances |
| `winston` | Journalisation et audit |
| `helmet` | En-têtes de sécurité HTTP |
| `joi` | Validation des données entrantes |

---

## 🔒 Sécurité

- **JWT Bearer Token** sur toutes les routes protégées
- **RBAC** (contrôle d'accès basé sur les rôles) via `autoriserRôles()`
- **Rate Limiting** : 500 req/15min global, 10 tentatives connexion/15min
- **HMAC SHA-256** pour les webhooks Mobile Money
- **Soft Delete** (paranoid Sequelize) : aucune donnée n'est physiquement supprimée
- **Journal d'audit** : toutes les actions financières sont tracées
- **Quittances infalsifiables** : hash SHA-256 + QR code signé
- **Bcrypt** (saltRounds=12) pour les mots de passe
- **Helmet** pour les en-têtes HTTP sécurisés
- **Blocage de compte** après 5 tentatives de connexion échouées
