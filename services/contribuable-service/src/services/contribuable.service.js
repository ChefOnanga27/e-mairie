import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ContribuableService {

  // ==============================
  // CREATE
  // ==============================
  async create(data) {
    try {
      const contribuable = await prisma.contribuable.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          nif: data.nif,
          typePersonne: data.typePersonne || "PHYSIQUE"
        }
      });

      return contribuable;

    } catch (error) {
      throw new Error("Erreur lors de la création du contribuable : " + error.message);
    }
  }

  // ==============================
  // GET ALL (avec pagination)
  // ==============================
  async findAll(page = 1, limit = 10) {

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.contribuable.findMany({
        skip,
        take: limit,
        where: { actif: true },
        orderBy: { createdAt: "desc" },
        include: {
          utilisateur: true,
          demandes: true,
          documents: true
        }
      }),
      prisma.contribuable.count({
        where: { actif: true }
      })
    ]);

    return {
      total,
      page,
      lastPage: Math.ceil(total / limit),
      data
    };
  }

  // ==============================
  // GET BY ID
  // ==============================
  async findById(id) {
    const contribuable = await prisma.contribuable.findUnique({
      where: { id: Number(id) },
      include: {
        utilisateur: true,
        demandes: true,
        documents: true,
        emissions: true
      }
    });

    if (!contribuable) {
      throw new Error("Contribuable introuvable");
    }

    return contribuable;
  }

  // ==============================
  // UPDATE
  // ==============================
  async update(id, data) {

    const exist = await prisma.contribuable.findUnique({
      where: { id: Number(id) }
    });

    if (!exist) {
      throw new Error("Contribuable introuvable");
    }

    return await prisma.contribuable.update({
      where: { id: Number(id) },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        nif: data.nif,
        typePersonne: data.typePersonne
      }
    });
  }

  // ==============================
  // DELETE LOGIQUE
  // ==============================
  async deactivate(id) {
    return await prisma.contribuable.update({
      where: { id: Number(id) },
      data: { actif: false }
    });
  }

  // ==============================
  // SEARCH
  // ==============================
  async search(query) {

    return await prisma.contribuable.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: "insensitive" } },
          { prenom: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { nif: { contains: query, mode: "insensitive" } }
        ]
      }
    });
  }
}

export default new ContribuableService();