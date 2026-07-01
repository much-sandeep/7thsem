/**
 * fpGrowthService.js — orchestration layer for FP-Growth.
 *
 * Responsibilities:
 *   1. Load dynamic configuration (min_support / min_confidence) from the DB.
 *   2. Build transactions from real billing data (bills + bill_items + items).
 *   3. Preprocess transactions (dedupe, frequency, filter, order).
 *   4. Construct the FP-Tree and header table.
 *   5. Mine frequent itemsets recursively.
 *   6. Generate association rules (support / confidence / lift).
 */
const { getPool } = require('../config/db');
const FPTree = require('./FPTree');
const { mineFrequentItemsets } = require('./fpMiner');
const { generateRules } = require('./ruleGenerator');
const {
  computeItemFrequencies,
  supportToMinCount,
  filterFrequentItems,
  orderTransaction,
  dedupeItems,
  frequencyMapToArray,
} = require('./utils');

// Fallback configuration used only when the settings table has no row.
const DEFAULT_MIN_SUPPORT = 0.05;
const DEFAULT_MIN_CONFIDENCE = 0.6;

/**
 * Load FP-Growth configuration from the settings table.
 * Falls back to defaults when the table is empty or unavailable, so the
 * thresholds are never hardcoded inside the algorithm itself.
 * @returns {Promise<{ minSupport: number, minConfidence: number }>}
 */
async function loadConfig() {
  const pool = getPool();

  try {
    const [rows] = await pool.query(
      'SELECT min_support, min_confidence FROM settings ORDER BY id ASC LIMIT 1'
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const { min_support, min_confidence } = rows[0];
      return {
        minSupport: min_support != null ? Number(min_support) : DEFAULT_MIN_SUPPORT,
        minConfidence:
          min_confidence != null ? Number(min_confidence) : DEFAULT_MIN_CONFIDENCE,
      };
    }
  } catch (error) {
    // A missing settings table should not crash analytics — log and fall back.
    console.warn('FP-Growth: could not read settings, using defaults:', error.message);
  }

  return {
    minSupport: DEFAULT_MIN_SUPPORT,
    minConfidence: DEFAULT_MIN_CONFIDENCE,
  };
}

/**
 * Build raw transactions from billing data.
 * Each bill becomes one transaction: a deduplicated list of item names.
 * Quantities are ignored on purpose (market-basket semantics).
 * @returns {Promise<string[][]>}
 */
async function buildTransactions() {
  const pool = getPool();

  const [rows] = await pool.query(`
    SELECT bi.bill_id AS billId, i.name AS itemName
    FROM bill_items bi
    INNER JOIN items i ON i.id = bi.item_id
    ORDER BY bi.bill_id ASC
  `);

  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // Group item names by bill id.
  const billMap = new Map();

  for (const row of rows) {
    // Validate each DB result before using it.
    if (row.billId == null || !row.itemName) {
      continue;
    }

    if (!billMap.has(row.billId)) {
      billMap.set(row.billId, []);
    }
    billMap.get(row.billId).push(row.itemName);
  }

  // Convert to an array of deduplicated transactions.
  return Array.from(billMap.values()).map((items) => dedupeItems(items));
}

/**
 * Run the full preprocessing pipeline.
 * @returns {Promise<object>} A bundle of intermediate artifacts.
 */
async function preprocess() {
  const config = await loadConfig();
  const rawTransactions = await buildTransactions();
  const totalTransactions = rawTransactions.length;

  // Handle empty datasets safely.
  if (totalTransactions === 0) {
    return {
      config,
      totalTransactions: 0,
      minCount: 0,
      rawTransactions: [],
      frequencies: new Map(),
      frequentItems: new Map(),
      orderedTransactions: [],
    };
  }

  const frequencies = computeItemFrequencies(rawTransactions);
  const minCount = supportToMinCount(config.minSupport, totalTransactions);
  const frequentItems = filterFrequentItems(frequencies, minCount);

  const orderedTransactions = rawTransactions
    .map((transaction) => orderTransaction(transaction, frequentItems))
    .filter((transaction) => transaction.length > 0);

  return {
    config,
    totalTransactions,
    minCount,
    rawTransactions,
    frequencies,
    frequentItems,
    orderedTransactions,
  };
}

/**
 * Build the FP-Tree from preprocessed transactions.
 * @returns {Promise<{ tree: FPTree, preprocessing: object }>}
 */
async function buildFPTree() {
  const preprocessing = await preprocess();
  const tree = new FPTree();
  tree.build(preprocessing.orderedTransactions);

  return { tree, preprocessing };
}

/* -------------------------------------------------------------------------- */
/* Mining + association rules.                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mine all frequent itemsets from real billing data.
 * @returns {Promise<object>}
 */
async function getFrequentItemsets() {
  const { tree, preprocessing } = await buildFPTree();
  const { config, totalTransactions, minCount } = preprocessing;

  const itemsets = mineFrequentItemsets(tree, minCount);

  return {
    config,
    totalTransactions,
    minCount,
    count: itemsets.length,
    itemsets: itemsets.map((entry) => ({
      items: entry.items,
      support: entry.support,
      supportPercent:
        totalTransactions > 0
          ? Number(((entry.support / totalTransactions) * 100).toFixed(2))
          : 0,
    })),
  };
}

/**
 * Mine frequent itemsets and derive association rules from them.
 * @returns {Promise<object>}
 */
async function getAssociationRules() {
  const { tree, preprocessing } = await buildFPTree();
  const { config, totalTransactions, minCount } = preprocessing;

  const itemsets = mineFrequentItemsets(tree, minCount);
  const rules = generateRules(itemsets, totalTransactions, config.minConfidence);

  return {
    config,
    totalTransactions,
    minCount,
    count: rules.length,
    rules,
  };
}

/* -------------------------------------------------------------------------- */
/* Debugging helpers (development only — surfaced via temporary endpoints).    */
/* -------------------------------------------------------------------------- */

/**
 * Processed transactions after dedupe / filter / ordering.
 */
async function debugProcessedTransactions() {
  const { config, totalTransactions, minCount, orderedTransactions } = await preprocess();
  return {
    config,
    totalTransactions,
    minCount,
    processedTransactions: orderedTransactions,
  };
}

/**
 * Global frequency table (before and after the support filter).
 */
async function debugFrequencyTable() {
  const { config, totalTransactions, minCount, frequencies, frequentItems } =
    await preprocess();

  return {
    config,
    totalTransactions,
    minCount,
    allItems: frequencyMapToArray(frequencies),
    frequentItems: frequencyMapToArray(frequentItems),
  };
}

/**
 * Header table after building the tree.
 */
async function debugHeaderTable() {
  const { tree, preprocessing } = await buildFPTree();
  return {
    config: preprocessing.config,
    totalTransactions: preprocessing.totalTransactions,
    minCount: preprocessing.minCount,
    headerTable: tree.getHeaderTableSummary(),
  };
}

/**
 * Printable FP-Tree structure.
 */
async function debugTreeStructure() {
  const { tree, preprocessing } = await buildFPTree();
  return {
    config: preprocessing.config,
    totalTransactions: preprocessing.totalTransactions,
    minCount: preprocessing.minCount,
    tree: tree.toJSON(),
  };
}

module.exports = {
  loadConfig,
  buildTransactions,
  preprocess,
  buildFPTree,
  getFrequentItemsets,
  getAssociationRules,
  debugProcessedTransactions,
  debugFrequencyTable,
  debugHeaderTable,
  debugTreeStructure,
  DEFAULT_MIN_SUPPORT,
  DEFAULT_MIN_CONFIDENCE,
};
