import prisma from '../../../../shared/config/prisma.js';

const findAll = (where, skip, take) =>
  prisma.document.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { typeDocument: true } });

const count = (where) => prisma.document.count({ where });

const findById = (id) =>
  prisma.document.findUnique({ where: { id }, include: { typeDocument: true, contribuable: true } });

const findByReference = (reference) =>
  prisma.document.findUnique({ where: { reference } });

export { findAll, count, findById, findByReference };