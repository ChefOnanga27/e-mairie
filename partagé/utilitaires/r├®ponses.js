// Fonctions utilitaires pour les réponses HTTP standardisées

export const répondreSuccès = (res, données, message = 'Opération réussie', codeStatut = 200) => {
  return res.status(codeStatut).json({
    succès: true,
    message,
    données,
    timestamp: new Date().toISOString(),
  });
};

export const répondreErreur = (res, message, codeStatut = 400, détails = null) => {
  return res.status(codeStatut).json({
    succès: false,
    message,
    détails,
    timestamp: new Date().toISOString(),
  });
};

export const répondreCréé = (res, données, message = 'Ressource créée avec succès') => {
  return répondreSuccès(res, données, message, 201);
};

export const répondrePaginé = (res, données, pagination, message = 'Liste récupérée') => {
  return res.status(200).json({
    succès: true,
    message,
    données,
    pagination: {
      page: pagination.page,
      limite: pagination.limite,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limite),
      aPageSuivante: pagination.page < Math.ceil(pagination.total / pagination.limite),
      aPagePrécédente: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

// Utilitaire de pagination pour Sequelize
export const extrairePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(query.limite) || 20));
  const décalage = (page - 1) * limite;
  return { page, limite, décalage };
};
