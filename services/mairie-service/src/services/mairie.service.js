import prisma from "../prisma.js";

class MairieService {

  
  // CREATE MAIRIE

  async create(data) {
    return await prisma.mairie.create({
      data: {
        nom: data.nom,
        adresse: data.adresse,
        telephone: data.telephone,
        email: data.email,
        villeId: data.villeId
      }
    });
  }

  // GET ALL

  async findAll() {
    return await prisma.mairie.findMany({
      include: {
        ville: {
          include: {
            province: true
          }
        },
        agents: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

 
  // GET BY ID
  
  async findById(id) {
    return await prisma.mairie.findUnique({
      where: { id: Number(id) },
      include: {
        ville: {
          include: {
            province: true
          }
        },
        agents: true,
        demandes: true
      }
    });
  }

 
  // UPDATE
 
  async update(id, data) {
    return await prisma.mairie.update({
      where: { id: Number(id) },
      data
    });
  }

  
  // DELETE LOGIQUE
  
  async deactivate(id) {
    return await prisma.mairie.update({
      where: { id: Number(id) },
      data: { actif: false }
    });
  }

}

export default new MairieService();