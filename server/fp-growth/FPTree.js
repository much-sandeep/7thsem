const FPNode = require('./FPNode');

/**
 * FPTree — builds and manages the FP-Tree.
 *
 * The tree compresses a set of transactions into a prefix tree where shared
 * prefixes are stored once with aggregated counts. A header table indexes the
 * first occurrence of every item and, together with node-link chains, allows
 * fast traversal of all occurrences of a given item.
 */
class FPTree {
  constructor() {
    this.root = new FPNode(null, null);
    // headerTable: Map<item, { count, head }>
    //   count = total support of the item across all transactions
    //   head  = first FPNode in this item's node-link chain
    this.headerTable = new Map();
  }

  /**
   * Insert a single ordered transaction (array of item names) into the tree.
   * The transaction MUST already be sorted by descending (conditional or global)
   * frequency so every path uses a consistent item ordering.
   *
   * The optional `count` weight lets conditional FP-Trees insert prefix paths
   * with the support of their suffix node. It defaults to 1, so existing callers
   * that pass a single transaction are unaffected.
   * @param {string[]} transaction
   * @param {number} [count=1]
   */
  insertTransaction(transaction, count = 1) {
    let current = this.root;

    for (const item of transaction) {
      let child = current.getChild(item);

      if (child) {
        // Path already exists — just bump the count.
        child.increment(count);
      } else {
        // Create a new branch node and link it into the header chain.
        child = new FPNode(item, current);
        child.increment(count);
        current.addChild(child);
        this.linkNode(item, child);
      }

      current = child;
    }
  }

  /**
   * Add a newly created node to the header table's node-link chain.
   * Only called once per node (the first time an item appears on a path),
   * so the chain holds exactly one entry per distinct tree branch.
   * Support counts are derived on demand from the chain (see itemSupport),
   * because a node's count keeps changing as later transactions are inserted.
   * @param {string} item
   * @param {FPNode} node
   */
  linkNode(item, node) {
    const entry = this.headerTable.get(item);

    if (!entry) {
      this.headerTable.set(item, { head: node });
      return;
    }

    // Walk to the end of the chain and append the new node.
    let tail = entry.head;
    while (tail.nodeLink) {
      tail = tail.nodeLink;
    }
    tail.nodeLink = node;
  }

  /**
   * Total support for an item = sum of counts across its node-link chain.
   * @param {string} item
   * @returns {number}
   */
  itemSupport(item) {
    const entry = this.headerTable.get(item);
    if (!entry) {
      return 0;
    }

    let total = 0;
    let node = entry.head;
    while (node) {
      total += node.count;
      node = node.nodeLink;
    }
    return total;
  }

  /**
   * Build a full tree from a list of ordered transactions.
   * @param {string[][]} transactions
   */
  build(transactions) {
    for (const transaction of transactions) {
      if (transaction.length > 0) {
        this.insertTransaction(transaction);
      }
    }
  }

  /**
   * Return the header table as a plain, serializable array.
   * @returns {Array<{ item: string, count: number }>}
   */
  getHeaderTableSummary() {
    return Array.from(this.headerTable.keys())
      .map((item) => ({ item, count: this.itemSupport(item) }))
      .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
  }

  /**
   * Produce a printable, nested representation of the tree for debugging.
   * @returns {object}
   */
  toJSON() {
    const serialize = (node) => ({
      item: node.isRoot() ? 'ROOT' : node.item,
      count: node.count,
      children: Array.from(node.children.values()).map(serialize),
    });

    return serialize(this.root);
  }
}

module.exports = FPTree;
