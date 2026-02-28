import { sendError } from '../utils/response.js';

/**
 * Valide les données de la requête avec un schéma Joi
 * @param {Object} schema - Schéma Joi avec les propriétés body, params, query
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(d => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(d => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(d => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors,
      });
    }

    next();
  };
};

export { validate };