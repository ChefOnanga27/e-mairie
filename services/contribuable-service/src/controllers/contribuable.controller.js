import contribuableService from "../services/contribuable.service.js";


// CREATE

export const create = async (req, res) => {
  try {
    const result = await contribuableService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// GET ALL

export const findAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await contribuableService.findAll(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET BY ID

export const findById = async (req, res) => {
  try {
    const result = await contribuableService.findById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


// UPDATE

export const update = async (req, res) => {
  try {
    const result = await contribuableService.update(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// DELETE LOGIQUE

export const deactivate = async (req, res) => {
  try {
    await contribuableService.deactivate(req.params.id);
    res.json({ message: "Contribuable désactivé avec succès" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// SEARCH

export const search = async (req, res) => {
  try {
    const result = await contribuableService.search(req.params.query);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};