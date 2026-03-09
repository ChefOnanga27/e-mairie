import mairieService from "../services/mairie.service.js";

export const create = async (req, res) => {
  try {
    const result = await mairieService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const findAll = async (req, res) => {
  const result = await mairieService.findAll();
  res.json(result);
};

export const findById = async (req, res) => {
  const result = await mairieService.findById(req.params.id);
  res.json(result);
};

export const update = async (req, res) => {
  const result = await mairieService.update(req.params.id, req.body);
  res.json(result);
};

export const deactivate = async (req, res) => {
  await mairieService.deactivate(req.params.id);
  res.json({ message: "Mairie désactivée" });
};