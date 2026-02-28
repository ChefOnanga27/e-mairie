const errorHandler = (err, req, res, next) => {
  console.error('[API Gateway Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du gateway',
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  });
};

export { errorHandler, notFound }; 