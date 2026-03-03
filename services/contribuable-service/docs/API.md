# 📘 API - Gestion des Contribuables

Base URL:
http://localhost:5000/api/contribuables

---

## 🔹 1. Créer un contribuable

POST /

Body:
```json
{
  "nom": "Doe",
  "prenom": "John",
  "email": "john@example.com",
  "telephone": "077000000",
  "adresse": "Libreville",
  "nif": "NIF123456",
  "typePersonne": "PHYSIQUE"
}