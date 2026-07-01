/**
 * ruleGenerator.js — association-rule generation from frequent itemsets.
 *
 * For every frequent itemset of size >= 2, we enumerate all non-empty proper
 * subsets as antecedents (A) with the remainder as the consequent (B), then
 * compute support, confidence, and lift. Only rules meeting the minimum
 * confidence threshold are returned.
 *
 *   support(A → B)    = support(A ∪ B) / N
 *   confidence(A → B) = support(A ∪ B) / support(A)
 *   lift(A → B)       = confidence(A → B) / (support(B) / N)
 *
 * where N is the total number of transactions. By the Apriori (downward-closure)
 * property, every subset of a frequent itemset is itself frequent, so all
 * supports needed below are available in the itemset map.
 */

/**
 * Build a stable lookup key for an itemset (order-independent).
 * @param {string[]} items
 * @returns {string}
 */
function itemsetKey(items) {
  return [...items].sort().join('\u0001');
}

/**
 * Index frequent itemsets by key for O(1) support lookups.
 * @param {Array<{ items: string[], support: number }>} itemsets
 * @returns {Map<string, number>}
 */
function buildSupportIndex(itemsets) {
  const index = new Map();
  for (const { items, support } of itemsets) {
    index.set(itemsetKey(items), support);
  }
  return index;
}

/**
 * Generate all non-empty proper subsets of an array.
 * Returns pairs of [subset, complement] so callers get antecedent + consequent.
 * @param {string[]} items
 * @returns {Array<{ antecedent: string[], consequent: string[] }>}
 */
function properSubsetPartitions(items) {
  const n = items.length;
  const partitions = [];
  const total = 1 << n;

  // Skip 0 (empty) and total-1 (full set) so both sides are non-empty.
  for (let mask = 1; mask < total - 1; mask += 1) {
    const antecedent = [];
    const consequent = [];
    for (let i = 0; i < n; i += 1) {
      if (mask & (1 << i)) {
        antecedent.push(items[i]);
      } else {
        consequent.push(items[i]);
      }
    }
    partitions.push({ antecedent, consequent });
  }

  return partitions;
}

/**
 * Generate association rules from frequent itemsets.
 * @param {Array<{ items: string[], support: number }>} itemsets
 * @param {number} totalTransactions
 * @param {number} minConfidence - Fractional threshold in [0, 1].
 * @returns {Array<object>} Rules meeting the confidence threshold.
 */
function generateRules(itemsets, totalTransactions, minConfidence) {
  // Guard against empty datasets / invalid inputs.
  if (!Array.isArray(itemsets) || itemsets.length === 0 || totalTransactions <= 0) {
    return [];
  }

  const supportIndex = buildSupportIndex(itemsets);
  const rules = [];

  for (const { items, support: itemsetSupport } of itemsets) {
    if (items.length < 2) {
      continue; // Rules need at least one item on each side.
    }

    for (const { antecedent, consequent } of properSubsetPartitions(items)) {
      const antecedentSupport = supportIndex.get(itemsetKey(antecedent));
      const consequentSupport = supportIndex.get(itemsetKey(consequent));

      if (antecedentSupport == null || consequentSupport == null) {
        continue; // Should not happen, but stay safe.
      }

      const confidence = itemsetSupport / antecedentSupport;
      if (confidence < minConfidence) {
        continue;
      }

      const supportFraction = itemsetSupport / totalTransactions;
      const consequentFraction = consequentSupport / totalTransactions;
      const lift = consequentFraction > 0 ? confidence / consequentFraction : 0;

      rules.push({
        antecedent,
        consequent,
        supportCount: itemsetSupport,
        support: Number(supportFraction.toFixed(4)),
        confidence: Number(confidence.toFixed(4)),
        lift: Number(lift.toFixed(4)),
      });
    }
  }

  // Highest confidence first, then lift, for readable output.
  return rules.sort(
    (a, b) => b.confidence - a.confidence || b.lift - a.lift
  );
}

module.exports = {
  generateRules,
  buildSupportIndex,
  properSubsetPartitions,
  itemsetKey,
};
