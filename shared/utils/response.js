/**
 * Envoie une réponse de succès
 */
const sendSuccess = (res, data = {}, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Envoie une réponse de succès pour création
 */
const sendCreated = (res, data = {}, message = 'Créé avec succès') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Envoie une réponse d'erreur
 */
const sendError = (res, statusCode = 500, message = 'Erreur interne', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Envoie une réponse paginée
 */
const sendPaginated = (res, data, pagination, message = 'Succès') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
  });
};

export { sendSuccess, sendCreated, sendError, sendPaginated }; 