# API Gateway

Point d'entrée unique pour tous les microservices de l'application e-mairie.

## 🌐 Port

**Port 3000**

## 📋 Description

L'API Gateway est le point d'entrée central de l'architecture microservices. Il gère :

- **Routage** des requêtes vers les microservices appropriés
- **Authentification JWT** pour les routes protégées
- **Rate limiting** pour éviter les abus
- **CORS** configuration
- **Logging** des requêtes
- **Sécurité** (Helmet)
- **Health checks** des services

## 🚀 Installation

```bash
npm install
```

## 📝 Variables d'environnement

Voir `.env` pour la configuration complète.

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
# ... URLs des services
```

## ▶️ Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

## 🔌 Routes principales

### Routes publiques

- `GET /health` - Health check
- `GET /version` - Version du service
- `GET /services` - Liste des services disponibles
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Routes protégées (authentification requise)

- `/api/provinces/*` - Province Service
- `/api/villes/*` - Ville Service
- `/api/mairies/*` - Mairie Service
- `/api/agents/*` - Agent Service
- `/api/contribuables/*` - Contribuable Service
- `/api/documents/*` - Document Service
- `/api/demandes/*` - Demande Service
- `/api/emettre/*` - Emettre Service
- `/api/utilisateurs/*` - Utilisateur Service
- `/api/reports/*` - Reporting Service
- `/api/audit/*` - Audit Service
- `/api/notifications/*` - Notification Service

## 🔐 Authentification

Les requêtes vers les routes protégées doivent inclure un token JWT :

```bash
Authorization: Bearer <token>
```

## 📊 Middleware

- **Helmet** - Sécurité des headers HTTP
- **CORS** - Configuration CORS
- **Morgan** - Logging
- **Rate Limit** - Limitation de requêtes
- **JWT Auth** - Vérification JWT
- **Error Handler** - Gestion des erreurs

## 🧪 Tests

```bash
npm test
npm run test:watch
```

## 📚 Documentation complète

Voir [docs/API.md](docs/API.md)