/**
 * fpMiner.js — recursive FP-Growth frequent-itemset mining.
 *
 * Given a built FP-Tree, this module mines every frequent itemset whose support
 * meets the minimum count. It works purely on the in-memory tree structures
 * (FPTree / FPNode) and does not touch the database.
 *
 * Algorithm (classic FP-Growth):
 *   For each item in the header table (processed least-frequent first):
 *     1. Emit the itemset {suffix ∪ item} with the item's support.
 *     2. Build its conditional pattern base (prefix paths ending at the item).
 *     3. Build a conditional FP-Tree from that pattern base.
 *     4. Recurse into the conditional tree with the extended suffix.
 */
const FPTree = require('./FPTree');

/**
 * Collect the prefix path (root-side first) leading to a node, excluding the
 * node itself and the synthetic root.
 * @param {import('./FPNode')} node
 * @returns {string[]}
 */
function collectPrefixPath(node) {
  const path = [];
  let current = node.parent;

  while (current && !current.isRoot()) {
    path.push(current.item);
    current = current.parent;
  }

  // Walking up yields node→root order; reverse to get root→node order.
  path.reverse();
  return path;
}

/**
 * Build the conditional pattern base for an item: every prefix path that
 * co-occurs with the item, weighted by that path's occurrence count.
 * @param {FPTree} tree
 * @param {string} item
 * @returns {Array<{ path: string[], count: number }>}
 */
function buildConditionalPatternBase(tree, item) {
  const entry = tree.headerTable.get(item);
  const patternBase = [];

  let node = entry ? entry.head : null;
  while (node) {
    const path = collectPrefixPath(node);
    if (path.length > 0) {
      patternBase.push({ path, count: node.count });
    }
    node = node.nodeLink;
  }

  return patternBase;
}

/**
 * Build a conditional FP-Tree from a conditional pattern base.
 * Items whose conditional support falls below `minCount` are pruned, preserving
 * the original (consistent) ordering of the surviving items on each path.
 * @param {Array<{ path: string[], count: number }>} patternBase
 * @param {number} minCount
 * @returns {FPTree}
 */
function buildConditionalTree(patternBase, minCount) {
  // Tally conditional support for each item in the pattern base.
  const condCounts = new Map();
  for (const { path, count } of patternBase) {
    for (const item of path) {
      condCounts.set(item, (condCounts.get(item) || 0) + count);
    }
  }

  const conditionalTree = new FPTree();

  for (const { path, count } of patternBase) {
    // Drop infrequent items but keep the remaining items in their original order.
    const filteredPath = path.filter((item) => condCounts.get(item) >= minCount);
    if (filteredPath.length > 0) {
      conditionalTree.insertTransaction(filteredPath, count);
    }
  }

  return conditionalTree;
}

/**
 * Recursively mine a tree, appending discovered itemsets to `results`.
 * @param {FPTree} tree
 * @param {number} minCount
 * @param {string[]} suffix - Items accumulated from parent recursion levels.
 * @param {Array<{ items: string[], support: number }>} results
 */
function mineTree(tree, minCount, suffix, results) {
  // Process items least-frequent first for the standard bottom-up expansion.
  const items = Array.from(tree.headerTable.keys())
    .map((item) => ({ item, support: tree.itemSupport(item) }))
    .filter((entry) => entry.support >= minCount)
    .sort((a, b) => a.support - b.support || a.item.localeCompare(b.item));

  for (const { item, support } of items) {
    const newItemset = [...suffix, item];
    results.push({ items: newItemset, support });

    const patternBase = buildConditionalPatternBase(tree, item);
    const conditionalTree = buildConditionalTree(patternBase, minCount);

    // Recurse only if the conditional tree still holds frequent items.
    if (conditionalTree.headerTable.size > 0) {
      mineTree(conditionalTree, minCount, newItemset, results);
    }
  }
}

/**
 * Public entry point: mine all frequent itemsets from a built FP-Tree.
 * @param {FPTree} tree
 * @param {number} minCount - Absolute minimum support count.
 * @returns {Array<{ items: string[], support: number }>}
 */
function mineFrequentItemsets(tree, minCount) {
  const results = [];

  // Empty tree or non-positive threshold → nothing to mine.
  if (!tree || tree.headerTable.size === 0 || minCount <= 0) {
    return results;
  }

  mineTree(tree, minCount, [], results);

  // Sort for stable, readable output: by itemset size, then support desc.
  return results.sort(
    (a, b) =>
      a.items.length - b.items.length ||
      b.support - a.support ||
      a.items.join(',').localeCompare(b.items.join(','))
  );
}

module.exports = {
  mineFrequentItemsets,
  buildConditionalPatternBase,
  buildConditionalTree,
};
