# API Gateway - Documentation API

## 🔍 Endpoints

### Health & Info

#### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "API Gateway"
}
```

#### Version
```
GET /version
```

**Response:**
```json
{
  "version": "1.0.0",
  "name": "E-Mairie API Gateway",
  "environment": "development"
}
```

#### Services List
```
GET /services
```

**Response:**
```json
{
  "success": true,
  "count": 13,
  "services": [
    {
      "name": "Auth Service",
      "port": 3001,
      "path": "/api/auth"
    },
    {
      "name": "Province Service",
      "port": 3002,
      "path": "/api/provinces"
    },
    // ... autres services
  ]
}
```

### Authentication Routes (Public)

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user-id",
    "email": "newuser@example.com"
  }
}
```

### Protected Routes

Tous les endpoints suivants nécessitent un token JWT dans le header `Authorization`.

```
Authorization: Bearer <token>
```

#### Provinces
```
GET /api/provinces
POST /api/provinces
GET /api/provinces/:id
PUT /api/provinces/:id
DELETE /api/provinces/:id
```

#### Villes
```
GET /api/villes
POST /api/villes
GET /api/villes/:id
PUT /api/villes/:id
DELETE /api/villes/:id
```

#### Mairies
```
GET /api/mairies
POST /api/mairies
GET /api/mairies/:id
PUT /api/mairies/:id
DELETE /api/mairies/:id
```

#### Agents
```
GET /api/agents
POST /api/agents
GET /api/agents/:id
PUT /api/agents/:id
DELETE /api/agents/:id
```

#### Contribuables
```
GET /api/contribuables
POST /api/contribuables
GET /api/contribuables/:id
PUT /api/contribuables/:id
DELETE /api/contribuables/:id
```

#### Documents
```
GET /api/documents
POST /api/documents
GET /api/documents/:id
PUT /api/documents/:id
DELETE /api/documents/:id
```

#### Demandes
```
GET /api/demandes
POST /api/demandes
GET /api/demandes/:id
PUT /api/demandes/:id
DELETE /api/demandes/:id
```

#### Emettre
```
GET /api/emettre
POST /api/emettre
GET /api/emettre/:id
PUT /api/emettre/:id
DELETE /api/emettre/:id
```

#### Utilisateurs
```
GET /api/utilisateurs
POST /api/utilisateurs
GET /api/utilisateurs/:id
PUT /api/utilisateurs/:id
DELETE /api/utilisateurs/:id
```

#### Reports
```
GET /api/reports
POST /api/reports
GET /api/reports/:id
```

#### Audit
```
GET /api/audit
GET /api/audit/:id
```

#### Notifications
```
GET /api/notifications
POST /api/notifications
GET /api/notifications/:id
DELETE /api/notifications/:id
```

## 🔐 Authentication

### Token Format

Les tokens JWT doivent être au format :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## ❌ Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "jwt expired"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Route not found",
  "path": "/api/unknown"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## 📝 Request Headers

```
Content-Type: application/json
Authorization: Bearer <token>
X-Forwarded-For: <client-ip>
```

## 🔄 Rate Limiting

- Limite : 100 requêtes par 15 minutes par IP
- Les résponses incluent les headers :
  - `RateLimit-Limit`: Limite maximale
  - `RateLimit-Remaining`: Requêtes restantes
  - `RateLimit-Reset`: Timestamp du reset

## 🔀 CORS

Configuration CORS :
- `Access-Control-Allow-Origin`: * (configurable)
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization

## 📝 Examples

### Exemple avec cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Provinces (avec token)
curl -X GET http://localhost:3000/api/provinces \
  -H "Authorization: Bearer <token>"

# Create Province
curl -X POST http://localhost:3000/api/provinces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Province Name","code":"PRV001"}'
```

### Exemple avec JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// Get Provinces
const provincesResponse = await fetch('http://localhost:3000/api/provinces', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await provincesResponse.json();
```
