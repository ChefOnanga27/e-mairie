const prisma = require('../../../../shared/config/prisma');

const findAll = (where, skip, take) =>
  prisma.agent.findMany({ where, skip, take, orderBy: { nom: 'asc' }, include: { mairie: true } });

const count = (where) => prisma.agent.count({ where });

const findById = (id) =>
  prisma.agent.findUnique({ where: { id }, include: { mairie: true } });

const findByMatricule = (matricule) =>
  prisma.agent.findUnique({ where: { matricule } });

module.exports = { findAll, count, findById, findByMatricule };