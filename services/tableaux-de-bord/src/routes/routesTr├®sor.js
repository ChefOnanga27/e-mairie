import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';
import { répondreSuccès } from '../../../../partagé/utilitaires/réponses.js';

export const routeurTrésor = Router();
export const routeurCitoyen = Router();
export const routeurRégie = Router();

// ─── TRÉSOR PUBLIC ─────────────────────────────────────────────────────────

// GET /api/tableau-de-bord/trésor/encaissements
routeurTrésor.get('/encaissements', async (req, res, next) => {
  try {
    const { dateDebut, dateFin } = req.query;

    const encaissements = await sequelize.query(`
      SELECT
        p.canal,
        DATE(p.date_confirmation)       AS date,
        COUNT(p.id)                     AS nombre_transactions,
        SUM(p.montant)                  AS montant_total,
        COUNT(DISTINCT q.id)            AS quittances_émises
      FROM paiements p
      LEFT JOIN quittances q ON p.id = q.paiement_id
      WHERE p.statut = 'validé'
        AND p.date_confirmation BETWEEN :dateDebut AND :dateFin
      GROUP BY p.canal, DATE(p.date_confirmation)
      ORDER BY date DESC, montant_total DESC
    `, {
      replacements: {
        dateDebut: dateDebut || new Date(new Date().setDate(1)).toISOString(),
        dateFin: dateFin || new Date().toISOString(),
      },
      type: QueryTypes.SELECT
    });

    return répondreSuccès(res, { encaissements }, 'Encaissements récupérés');
  } catch (erreur) { next(erreur); }
});

// GET /api/tableau-de-bord/trésor/journal-comptable
routeurTrésor.get('/journal-comptable', async (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const journal = await sequelize.query(`
      SELECT
        p.id, p.référence_paiement, p.canal, p.montant,
        p.date_confirmation, p.transaction_id_externe,
        q.numéro_quittance, q.code_vérification,
        p.contribuable_id
      FROM paiements p
      LEFT JOIN quittances q ON p.id = q.paiement_id
      WHERE p.statut = 'validé'
        AND DATE(p.date_confirmation) = :date
      ORDER BY p.date_confirmation ASC
    `, { replacements: { date }, type: QueryTypes.SELECT });

    const total = journal.reduce((acc, p) => acc + parseFloat(p.montant), 0);

    return répondreSuccès(res, {
      date,
      transactions: journal,
      totalJournée: total,
      nombreTransactions: journal.length,
    }, 'Journal comptable journalier');
  } catch (erreur) { next(erreur); }
});

// ─── CITOYEN / ENTREPRISE ──────────────────────────────────────────────────

// GET /api/tableau-de-bord/citoyen/situation-fiscale
routeurCitoyen.get('/situation-fiscale', async (req, res, next) => {
  try {
    const contribuableId = req.utilisateur.id;

    const situationFiscale = await sequelize.query(`
      SELECT
        f.numéro_facture, tt.libellé AS type_taxe, tt.catégorie,
        f.période, f.montant_total, f.montant_payé,
        (f.montant_total - f.montant_payé) AS solde_dû,
        f.date_échéance, f.statut,
        CASE WHEN f.date_échéance < CURRENT_DATE AND f.statut != 'payé'
             THEN 'en_retard' ELSE 'dans_les_délais'
        END AS état_paiement
      FROM factures f
      JOIN types_taxes tt ON f.type_taxe_id = tt.id
      WHERE f.contribuable_id = :contribuableId
        AND f.deleted_at IS NULL
      ORDER BY f.date_échéance ASC
    `, { replacements: { contribuableId }, type: QueryTypes.SELECT });

    const totalDû = situationFiscale
      .filter(f => f.statut !== 'payé')
      .reduce((acc, f) => acc + parseFloat(f.solde_dû), 0);

    return répondreSuccès(res, {
      contribuableId,
      factures: situationFiscale,
      totalDû,
      nombreImpayés: situationFiscale.filter(f => f.statut !== 'payé').length,
    }, 'Situation fiscale personnelle');
  } catch (erreur) { next(erreur); }
});

// GET /api/tableau-de-bord/citoyen/historique-paiements
routeurCitoyen.get('/historique-paiements', async (req, res, next) => {
  try {
    const historiqueRaw = await sequelize.query(`
      SELECT p.référence_paiement, p.montant, p.canal, p.statut,
             p.date_confirmation, q.numéro_quittance
      FROM paiements p
      LEFT JOIN quittances q ON p.id = q.paiement_id
      WHERE p.contribuable_id = :contribuableId
      ORDER BY p.date_initiation DESC
      LIMIT 50
    `, { replacements: { contribuableId: req.utilisateur.id }, type: QueryTypes.SELECT });

    return répondreSuccès(res, historiqueRaw, 'Historique des paiements');
  } catch (erreur) { next(erreur); }
});

// ─── RÉGIE MUNICIPALE ──────────────────────────────────────────────────────

// GET /api/tableau-de-bord/régie/performance-agents
routeurRégie.get('/performance-agents', async (req, res, next) => {
  try {
    const { dateDebut, dateFin } = req.query;

    const performance = await sequelize.query(`
      SELECT
        p.agent_id,
        COUNT(p.id)    AS nombre_transactions,
        SUM(p.montant) AS montant_encaissé
      FROM paiements p
      WHERE p.canal = 'guichet'
        AND p.statut = 'validé'
        AND p.date_confirmation BETWEEN :dateDebut AND :dateFin
        AND p.agent_id IS NOT NULL
      GROUP BY p.agent_id
      ORDER BY montant_encaissé DESC
    `, {
      replacements: {
        dateDebut: dateDebut || new Date(new Date().setDate(1)).toISOString(),
        dateFin: dateFin || new Date().toISOString(),
      },
      type: QueryTypes.SELECT
    });

    return répondreSuccès(res, { performance }, 'Performance des agents');
  } catch (erreur) { next(erreur); }
});

// GET /api/tableau-de-bord/régie/factures-impayées
routeurRégie.get('/factures-impayées', async (req, res, next) => {
  try {
    const { page = 1, limite = 20 } = req.query;
    const décalage = (page - 1) * limite;

    const impayées = await sequelize.query(`
      SELECT f.numéro_facture, f.contribuable_id, f.montant_total,
             f.montant_payé, f.date_échéance, f.nombre_relances,
             f.dernière_relance, tt.libellé AS type_taxe,
             CURRENT_DATE - f.date_échéance AS jours_retard
      FROM factures f
      JOIN types_taxes tt ON f.type_taxe_id = tt.id
      WHERE f.statut IN ('en_attente', 'partiellement_payé')
        AND f.date_échéance < CURRENT_DATE
        AND f.deleted_at IS NULL
      ORDER BY jours_retard DESC
      LIMIT :limite OFFSET :décalage
    `, { replacements: { limite, décalage }, type: QueryTypes.SELECT });

    return répondreSuccès(res, { impayées, page, limite }, 'Factures impayées en retard');
  } catch (erreur) { next(erreur); }
});
