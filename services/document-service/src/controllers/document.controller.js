import prisma from '../../../../shared/config/prisma.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../../../../shared/utils/response.js';
import { getPaginationParams } from '../../../../shared/utils/pagination.js';
import { generateReference } from '../../../../shared/utils/helpers.js';
import { deleteFile } from '../services/upload.service.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { contribuableId, typeDocumentId, statut } = req.query;

    const where = {};
    if (contribuableId) where.contribuableId = parseInt(contribuableId);
    if (typeDocumentId) where.typeDocumentId = parseInt(typeDocumentId);
    if (statut) where.statut = statut;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { typeDocument: true, contribuable: { select: { id: true, nom: true, prenom: true } } },
      }),
      prisma.document.count({ where }),
    ]);

    return sendPaginated(res, documents, { page, limit, total });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        typeDocument: true,
        contribuable: true,
        demande: true,
        emission: { include: { agent: true } },
      },
    });
    if (!document) return sendError(res, 404, 'Document non trouvé');
    return sendSuccess(res, document);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { typeDocumentId, contribuableId, dateExpiration, metadonnees } = req.body;
    const cheminFichier = req.file ? req.file.path : null;

    const [typeDoc, contrib] = await Promise.all([
      prisma.typeDocument.findUnique({ where: { id: typeDocumentId } }),
      prisma.contribuable.findUnique({ where: { id: contribuableId } }),
    ]);

    if (!typeDoc) return sendError(res, 400, 'Type de document non trouvé');
    if (!contrib) return sendError(res, 400, 'Contribuable non trouvé');

    const reference = generateReference('DOC');
    const document = await prisma.document.create({
      data: {
        reference,
        typeDocumentId,
        contribuableId,
        cheminFichier,
        statut: 'BROUILLON',
        dateExpiration: dateExpiration ? new Date(dateExpiration) : null,
        metadonnees: metadonnees ? JSON.parse(metadonnees) : null,
      },
    });

    return sendCreated(res, document, 'Document créé');
  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { statut, dateExpiration, metadonnees } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return sendError(res, 404, 'Document non trouvé');

    const cheminFichier = req.file ? req.file.path : existing.cheminFichier;
    if (req.file && existing.cheminFichier) deleteFile(existing.cheminFichier);

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(statut && { statut }),
        ...(dateExpiration && { dateExpiration: new Date(dateExpiration) }),
        ...(metadonnees && { metadonnees: JSON.parse(metadonnees) }),
        cheminFichier,
      },
    });

    return sendSuccess(res, document, 'Document mis à jour');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return sendError(res, 404, 'Document non trouvé');

    if (document.cheminFichier) deleteFile(document.cheminFichier);
    await prisma.document.delete({ where: { id } });

    return sendSuccess(res, {}, 'Document supprimé');
  } catch (err) { next(err); }
};

// Types de documents
const getAllTypes = async (req, res, next) => {
  try {
    const types = await prisma.typeDocument.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } });
    return sendSuccess(res, types);
  } catch (err) { next(err); }
};

const createType = async (req, res, next) => {
  try {
    const { nom, code, description, prix } = req.body;
    const type = await prisma.typeDocument.create({ data: { nom, code: code.toUpperCase(), description, prix } });
    return sendCreated(res, type, 'Type de document créé');
  } catch (err) { next(err); }
};

export { getAll, getById, create, update, remove, getAllTypes, createType };