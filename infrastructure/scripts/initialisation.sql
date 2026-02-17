-- ============================================================
-- INITIALISATION DE LA BASE DE DONNÉES MUNICIPALE
-- ============================================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour les statistiques et recherche textuelle
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extension pour le chiffrement
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Commentaires sur la base de données ──────────────────────────────────
COMMENT ON DATABASE recouvrement_municipal IS
  'Base de données de la plateforme de recouvrement des recettes municipales';

-- ── Création des rôles de base de données ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_lecture') THEN
    CREATE ROLE role_lecture;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_écriture') THEN
    CREATE ROLE role_écriture;
  END IF;
END
$$;

-- Permissions
GRANT CONNECT ON DATABASE recouvrement_municipal TO role_lecture, role_écriture;
GRANT USAGE ON SCHEMA public TO role_lecture, role_écriture;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_lecture;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO role_écriture;

-- ── Index de performance supplémentaires ─────────────────────────────────
-- (Les tables sont créées par Sequelize, ces index sont ajoutés après)

-- Index de recherche textuelle sur les contribuables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contribuables_recherche_texte
  ON contribuables USING gin(
    (nom || ' ' || COALESCE(prénom, '') || ' ' || COALESCE(raison_sociale, '')) gin_trgm_ops
  );

-- Index partiel pour les factures impayées (très fréquemment requêtées)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_factures_impayées
  ON factures (date_échéance, montant_total)
  WHERE statut IN ('en_attente', 'partiellement_payé') AND deleted_at IS NULL;

-- Index pour les paiements récents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paiements_récents
  ON paiements (date_confirmation DESC)
  WHERE statut = 'validé';

-- ── Vues utilitaires ──────────────────────────────────────────────────────

-- Vue: Situation fiscale par contribuable
CREATE OR REPLACE VIEW vue_situation_fiscale AS
  SELECT
    f.contribuable_id,
    COUNT(f.id)                    AS total_factures,
    SUM(f.montant_total)           AS total_dû,
    SUM(f.montant_payé)            AS total_payé,
    SUM(f.montant_total - f.montant_payé) AS solde_restant,
    COUNT(CASE WHEN f.statut = 'payé' THEN 1 END) AS factures_payées,
    COUNT(CASE WHEN f.statut IN ('en_attente', 'partiellement_payé') AND f.date_échéance < CURRENT_DATE THEN 1 END) AS factures_en_retard,
    MAX(f.date_échéance)           AS prochaine_échéance
  FROM factures f
  WHERE f.deleted_at IS NULL
  GROUP BY f.contribuable_id;

-- Vue: Statistiques journalières des encaissements
CREATE OR REPLACE VIEW vue_encaissements_journaliers AS
  SELECT
    DATE(p.date_confirmation)   AS date,
    p.canal,
    COUNT(p.id)                  AS nombre_transactions,
    SUM(p.montant)               AS montant_total,
    COUNT(DISTINCT p.contribuable_id) AS contribuables_uniques
  FROM paiements p
  WHERE p.statut = 'validé'
    AND p.date_confirmation IS NOT NULL
  GROUP BY DATE(p.date_confirmation), p.canal;

-- Vue: Factures avec pénalités calculées
CREATE OR REPLACE VIEW vue_factures_avec_pénalités AS
  SELECT
    f.*,
    CASE
      WHEN f.date_échéance >= CURRENT_DATE OR f.statut = 'payé' THEN f.montant_total
      ELSE f.montant_total * (1 + (f.taux_pénalité / 100) *
           CEIL(EXTRACT(DAY FROM (CURRENT_DATE - f.date_échéance)) / 30))
    END AS montant_actualisé,
    GREATEST(0, CURRENT_DATE - f.date_échéance) AS jours_retard
  FROM factures f
  WHERE f.deleted_at IS NULL;

-- ── Message de confirmation ───────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Base de données municipale initialisée avec succès';
END $$;
