import prisma from '../../../../shared/config/prisma.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../../../../shared/utils/response.js';
import { getPaginationParams } from '../../../../shared/utils/pagination.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, mairieId, actif } = req.query;

    const where = {};
    if (search) where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { matricule: { contains: search, mode: 'insensitive' } },
    ];
    if (mairieId) where.mairieId = parseInt(mairieId);
    if (actif !== undefined) where.actif = actif === 'true';

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({ where, skip, take: limit, orderBy: { nom: 'asc' }, include: { mairie: true } }),
      prisma.agent.count({ where }),
    ]);

    return sendPaginated(res, agents, { page, limit, total });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { mairie: { include: { ville: { include: { province: true } } } } },
    });
    if (!agent) return sendError(res, 404, 'Agent non trouvé');
    return sendSuccess(res, agent);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { nom, prenom, email, telephone, matricule, mairieId } = req.body;

    const mairie = await prisma.mairie.findUnique({ where: { id: mairieId } });
    if (!mairie) return sendError(res, 400, 'Mairie non trouvée');

    const agent = await prisma.agent.create({ data: { nom, prenom, email, telephone, matricule, mairieId } });
    return sendCreated(res, agent, 'Agent créé');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { nom, prenom, email, telephone, matricule, mairieId, actif } = req.body;
    const agent = await prisma.agent.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(email && { email }),
        ...(telephone !== undefined && { telephone }),
        ...(matricule && { matricule }),
        ...(mairieId && { mairieId }),
        ...(actif !== undefined && { actif }),
      },
    });
    return sendSuccess(res, agent, 'Agent mis à jour');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.agent.update({ where: { id }, data: { actif: false } });
    return sendSuccess(res, {}, 'Agent désactivé');
  } catch (err) { next(err); }
};

export { getAll, getById, create, update, remove }; 