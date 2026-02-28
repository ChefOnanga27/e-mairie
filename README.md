# 🏛️ Municipal Revenue Platform

Plateforme de gestion des recettes municipales pour les mairies du Gabon.  
Architecture microservices Node.js / Express / Prisma / PostgreSQL.

## 🏗️ Architecture

| Service | Port | Rôle |
|---|---|---|
| api-gateway | 3000 | Point d'entrée unique, proxy, auth |
| auth-service | 3001 | Authentification JWT |
| province-service | 3002 | Gestion des provinces |
| ville-service | 3003 | Gestion des villes |
| mairie-service | 3004 | Gestion des mairies |
| agent-service | 3005 | Gestion des agents |
| contribuable-service | 3006 | Gestion des contribuables |
| document-service | 3007 | Gestion des documents |
| demande-service | 3008 | Demandes citoyennes |
| emettre-service | 3009 | Émission de documents |
| utilisateur-service | 3010 | Gestion des utilisateurs |
| reporting-service | 3011 | Rapports & statistiques |
| audit-service | 3012 | Audit & traçabilité |
| notification-service | 3013 | Emails & SMS |

## 🚀 Démarrage rapide

```bash
# 1. Cloner le projet
git clone <repo-url>
cd municipal-revenue-platform

# 2. Configurer l'environnement
cp .env.example .env
# Editer .env avec vos valeurs

# 3. Installer toutes les dépendances
bash scripts/install-all.sh

# 4. Initialiser la base de données
npm run db:migrate
npm run seed

# 5. Démarrer tous les services
bash scripts/start-all.sh
```

## 📚 Documentation

- [Installation](docs/INSTALLATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Base de données](docs/DATABASE.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [Sécurité](docs/SECURITY.md)

## 🛠️ Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **DB**: PostgreSQL
- **Auth**: JWT
- **Logs**: Winston
- **Tests**: Jest

## 📋 Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9