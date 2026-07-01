/**
 * utils.js — pure helper functions for FP-Growth preprocessing.
 *
 * None of these functions touch the database or any shared state; they only
 * transform plain data structures, which keeps them easy to test and reason
 * about.
 */

/**
 * Compute how many transactions each item appears in (global frequency).
 * Items are counted once per transaction regardless of quantity.
 * @param {string[][]} transactions
 * @returns {Map<string, number>}
 */
function computeItemFrequencies(transactions) {
  const frequencies = new Map();

  for (const transaction of transactions) {
    for (const item of transaction) {
      frequencies.set(item, (frequencies.get(item) || 0) + 1);
    }
  }

  return frequencies;
}

/**
 * Convert a fractional support threshold into an absolute transaction count.
 * Example: minSupport 0.05 over 200 transactions => ceil(10) = 10.
 * @param {number} minSupport - Fractional threshold in the range [0, 1].
 * @param {number} totalTransactions
 * @returns {number}
 */
function supportToMinCount(minSupport, totalTransactions) {
  return Math.ceil(minSupport * totalTransactions);
}

/**
 * Remove items whose global frequency is below the minimum count.
 * @param {Map<string, number>} frequencies
 * @param {number} minCount
 * @returns {Map<string, number>} A new map containing only frequent items.
 */
function filterFrequentItems(frequencies, minCount) {
  const frequent = new Map();

  for (const [item, count] of frequencies.entries()) {
    if (count >= minCount) {
      frequent.set(item, count);
    }
  }

  return frequent;
}

/**
 * Order a single transaction:
 *   1. Drop items that are not globally frequent.
 *   2. Sort the survivors by descending global frequency.
 *   3. Break ties alphabetically so the ordering is deterministic.
 * @param {string[]} transaction
 * @param {Map<string, number>} frequentItems
 * @returns {string[]}
 */
function orderTransaction(transaction, frequentItems) {
  return transaction
    .filter((item) => frequentItems.has(item))
    .sort((a, b) => {
      const diff = frequentItems.get(b) - frequentItems.get(a);
      if (diff !== 0) {
        return diff;
      }
      return a.localeCompare(b);
    });
}

/**
 * Remove duplicate items within a single transaction (set semantics).
 * @param {string[]} items
 * @returns {string[]}
 */
function dedupeItems(items) {
  return Array.from(new Set(items));
}

/**
 * Convert a Map<item, count> into a sorted, serializable array.
 * @param {Map<string, number>} frequencyMap
 * @returns {Array<{ item: string, count: number }>}
 */
function frequencyMapToArray(frequencyMap) {
  return Array.from(frequencyMap.entries())
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
}

module.exports = {
  computeItemFrequencies,
  supportToMinCount,
  filterFrequentItems,
  orderTransaction,
  dedupeItems,
  frequencyMapToArray,
};
