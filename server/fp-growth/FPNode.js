/**
 * FPNode — a single node in the FP-Tree.
 *
 * Each node represents one item occurrence on a path from the root.
 * Identical items appearing in different branches are linked together
 * via the `nodeLink` pointer (the "node-link chain") so the header table
 * can walk every occurrence of an item quickly.
 */
class FPNode {
  /**
   * @param {string|null} item - The item name, or null for the root node.
   * @param {FPNode|null} parent - Reference to the parent node.
   */
  constructor(item, parent = null) {
    this.item = item;
    this.count = 0;
    this.parent = parent;
    // Children keyed by item name for O(1) lookup during insertion.
    this.children = new Map();
    // Pointer to the next node holding the same item (node-link chain).
    this.nodeLink = null;
  }

  /**
   * Increment this node's occurrence count.
   * @param {number} amount
   */
  increment(amount = 1) {
    this.count += amount;
  }

  /**
   * Return an existing child for the given item, or undefined.
   * @param {string} item
   * @returns {FPNode|undefined}
   */
  getChild(item) {
    return this.children.get(item);
  }

  /**
   * Attach a child node under this node.
   * @param {FPNode} node
   */
  addChild(node) {
    this.children.set(node.item, node);
  }

  /**
   * Whether this node is the synthetic root (item === null).
   * @returns {boolean}
   */
  isRoot() {
    return this.item === null;
  }
}

module.exports = FPNode;
