import demandeService from "../services/demande.service.js";

export const create = async (req, res) => {
  try {
    const result = await demandeService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const findAll = async (req, res) => {
  const result = await demandeService.findAll();
  res.json(result);
};

export const findById = async (req, res) => {
  const result = await demandeService.findById(req.params.id);
  res.json(result);
};

export const assignAgent = async (req, res) => {
  const result = await demandeService.assignAgent(
    req.params.id,
    req.body.agentId
  );
  res.json(result);
};

export const approve = async (req, res) => {
  const result = await demandeService.approve(req.params.id);
  res.json(result);
};

export const reject = async (req, res) => {
  const result = await demandeService.reject(
    req.params.id,
    req.body.motif
  );
  res.json(result);
};

export const deliver = async (req, res) => {
  const result = await demandeService.deliver(req.params.id);
  res.json(result);
};