import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';
import { répondreSuccès } from '../../../../partagé/utilitaires/réponses.js';

const routeur = Router();

// GET /api/tableau-de-bord/mairie/vue-ensemble
routeur.get('/vue-ensemble', async (req, res, next) => {
  try {
    const { année = new Date().getFullYear() } = req.query;

    // Recettes totales par catégorie
    const recettesParCatégorie = await sequelize.query(`
      SELECT tt.catégorie,
             COUNT(f.id)                               AS nombre_factures,
             SUM(f.montant_total)                     AS montant_total_émis,
             SUM(f.montant_payé)                      AS montant_total_recouvré,
             ROUND(SUM(f.montant_payé) / NULLIF(SUM(f.montant_total), 0) * 100, 2) AS taux_recouvrement
      FROM factures f
      JOIN types_taxes tt ON f.type_taxe_id = tt.id
      WHERE EXTRACT(YEAR FROM f.date_emission) = :année
        AND f.deleted_at IS NULL
      GROUP BY tt.catégorie
      ORDER BY montant_total_recouvré DESC
    `, { replacements: { année }, type: QueryTypes.SELECT });

    // Évolution mensuelle de l'année
    const évolutionMensuelle = await sequelize.query(`
      SELECT EXTRACT(MONTH FROM p.date_confirmation) AS mois,
             TO_CHAR(p.date_confirmation, 'Month')   AS nom_mois,
             COUNT(p.id)                             AS nombre_paiements,
             SUM(p.montant)                          AS montant_encaissé
      FROM paiements p
      WHERE p.statut = 'validé'
        AND EXTRACT(YEAR FROM p.date_confirmation) = :année
      GROUP BY EXTRACT(MONTH FROM p.date_confirmation), TO_CHAR(p.date_confirmation, 'Month')
      ORDER BY mois
    `, { replacements: { année }, type: QueryTypes.SELECT });

    // Indicateurs KPI globaux
    const kpi = await sequelize.query(`
      SELECT
        COUNT(DISTINCT f.id)                                           AS total_factures,
        COUNT(DISTINCT CASE WHEN f.statut = 'payé' THEN f.id END)    AS factures_payées,
        COUNT(DISTINCT CASE WHEN f.statut = 'en_attente' THEN f.id END) AS factures_impayées,
        SUM(f.montant_total)                                           AS total_émis,
        SUM(f.montant_payé)                                            AS total_recouvré,
        ROUND(SUM(f.montant_payé) / NULLIF(SUM(f.montant_total), 0) * 100, 2) AS taux_recouvrement_global
      FROM factures f
      WHERE EXTRACT(YEAR FROM f.date_emission) = :année
        AND f.deleted_at IS NULL
    `, { replacements: { année }, type: QueryTypes.SELECT });

    // Top 5 des impayés les plus importants
    const top5Impayés = await sequelize.query(`
      SELECT f.numéro_facture, f.contribuable_id, f.montant_total,
             f.montant_payé, (f.montant_total - f.montant_payé) AS solde_restant,
             f.date_échéance, tt.libellé AS type_taxe
      FROM factures f
      JOIN types_taxes tt ON f.type_taxe_id = tt.id
      WHERE f.statut IN ('en_attente', 'partiellement_payé')
        AND f.deleted_at IS NULL
      ORDER BY solde_restant DESC
      LIMIT 5
    `, { type: QueryTypes.SELECT });

    return répondreSuccès(res, {
      année,
      kpi: kpi[0],
      recettesParCatégorie,
      évolutionMensuelle,
      top5Impayés,
      générééÀ: new Date().toISOString(),
    }, 'Tableau de bord mairie récupéré');
  } catch (erreur) { next(erreur); }
});

// GET /api/tableau-de-bord/mairie/prévisions
routeur.get('/prévisions', async (req, res, next) => {
  try {
    const { année = new Date().getFullYear() } = req.query;

    const prévisions = await sequelize.query(`
      SELECT tt.libellé AS type_taxe,
             tt.catégorie,
             COUNT(f.id) AS nombre_attendu,
             SUM(f.montant_total) AS montant_attendu,
             SUM(CASE WHEN f.statut = 'payé' THEN f.montant_payé ELSE 0 END) AS montant_réalisé,
             SUM(f.montant_total) - SUM(CASE WHEN f.statut = 'payé' THEN f.montant_payé ELSE 0 END) AS écart
      FROM factures f
      JOIN types_taxes tt ON f.type_taxe_id = tt.id
      WHERE EXTRACT(YEAR FROM f.date_emission) = :année AND f.deleted_at IS NULL
      GROUP BY tt.id, tt.libellé, tt.catégorie
      ORDER BY montant_attendu DESC
    `, { replacements: { année }, type: QueryTypes.SELECT });

    return répondreSuccès(res, { année, prévisions }, 'Prévisions vs réalisé');
  } catch (erreur) { next(erreur); }
});

// GET /api/tableau-de-bord/mairie/rapport-mensuel
routeur.get('/rapport-mensuel', async (req, res, next) => {
  try {
    const { mois = new Date().getMonth() + 1, année = new Date().getFullYear() } = req.query;

    const rapport = await sequelize.query(`
      SELECT
        COUNT(p.id)      AS nombre_transactions,
        SUM(p.montant)   AS total_encaissé,
        p.canal,
        COUNT(DISTINCT p.contribuable_id) AS contribuables_ayant_payé
      FROM paiements p
      WHERE p.statut = 'validé'
        AND EXTRACT(MONTH FROM p.date_confirmation) = :mois
        AND EXTRACT(YEAR FROM p.date_confirmation) = :année
      GROUP BY p.canal
    `, { replacements: { mois, année }, type: QueryTypes.SELECT });

    return répondreSuccès(res, { mois, année, rapport }, 'Rapport mensuel');
  } catch (erreur) { next(erreur); }
});

export default routeur;
