# Agent Service

Microservice responsable de la gestion des agents de mairie.

## 🚀 Démarrage

```bash
npm install
# Variables d'environnement dans .env
npm run dev   # en développement (nodemon)
npm start     # production
```

## 📁 Structure

```
src/
├── controllers/agent.controller.js
├── routes/agent.routes.js
└── server.js
```

## ⚙️ Configuration

Variables disponibles dans `.env` :

```
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
JWT_SECRET=secret
MAIRIE_SERVICE_URL=http://localhost:3004
```

## 🛠️ Dépendances principales

- express, cors, helmet
- prisma (ORM)
- http-proxy-middleware (utilisé par API Gateway)
- winston (journalisation via shared)

## 🧪 Tests

Les tests sont situés dans le dossier `tests/` et utilisent [Jest](https://jestjs.io) avec [SuperTest](https://github.com/visionmedia/supertest) pour appeler l'API. Un exemple basique vérifie le `health` et la route de récupération des agents en contournant les middlewares de sécurité et en moquant le client Prisma.

```bash
npm run test        # exécute tous les tests une seule fois
npm run test:watch  # relance automatiquement les tests quand les fichiers changent
```

## 💡 Notes

Ce service utilise des modules partagés situés dans `../shared` pour la configuration, les middlewares et les utilitaires. Assurez-vous que le dossier `shared` est initialisé et que les dépendances globales (winston, bcryptjs, etc.) sont installées au niveau racine du projet.

Lancer l'API Gateway permet de proxyfier les requêtes vers ce service sur `/api/agent`.
