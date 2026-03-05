import prisma from "../prisma.js";

class DemandeService {

  // CREATE DEMANDE
  
  async create(data) {

    const reference = "DEM-" + Date.now();

    return await prisma.demande.create({
      data: {
        reference,
        
        mairieId: data.mairieId,
        typeDocumentId: data.typeDocumentId,
        statut: "EN_ATTENTE"
      }
    });
  }

  // GET ALL

  async findAll() {
    return await prisma.demande.findMany({
      include: {
        contribuable: true,
        mairie: true,
        agent: true,
        typeDocument: true,
        document: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

 
  // GET BY ID

  async findById(id) {
    return await prisma.demande.findUnique({
      where: { id: Number(id) },
      include: {
        contribuable: true,
        mairie: true,
        agent: true,
        typeDocument: true,
        document: true
      }
    });
  }


  // ASSIGN AGENT
  
  async assignAgent(id, agentId) {
    return await prisma.demande.update({
      where: { id: Number(id) },
      data: {
        agentId: Number(agentId),
        statut: "EN_COURS"
      }
    });
  }


  // APPROUVE

  async approve(id) {
    return await prisma.demande.update({
      where: { id: Number(id) },
      data: {
        statut: "APPROUVEE"
      }
    });
  }


  // REJECT

  async reject(id, motif) {
    return await prisma.demande.update({
      where: { id: Number(id) },
      data: {
        statut: "REJETEE",
        motifRejet: motif
      }
    });
  }


  // MARK AS LIVREE
  
  async deliver(id) {
    return await prisma.demande.update({
      where: { id: Number(id) },
      data: {
        statut: "LIVREE"
      }
    });
  }

}

export default new DemandeService();