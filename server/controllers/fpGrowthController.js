const fpGrowthService = require('../fp-growth/fpGrowthService');

/**
 * Temporary debug controllers for the FP-Tree construction stage.
 * These expose the intermediate artifacts so the tree build can be verified
 * against real billing data. They will be removed once mining is in place.
 */

async function getItemsets(_req, res) {
  try {
    const data = await fpGrowthService.getFrequentItemsets();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth itemsets error:', error);
    return res.status(500).json({ error: 'Failed to mine frequent itemsets' });
  }
}

async function getRules(_req, res) {
  try {
    const data = await fpGrowthService.getAssociationRules();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth rules error:', error);
    return res.status(500).json({ error: 'Failed to generate association rules' });
  }
}

async function getProcessedTransactions(_req, res) {
  try {
    const data = await fpGrowthService.debugProcessedTransactions();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth processed transactions error:', error);
    return res.status(500).json({ error: 'Failed to build processed transactions' });
  }
}

async function getFrequencyTable(_req, res) {
  try {
    const data = await fpGrowthService.debugFrequencyTable();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth frequency table error:', error);
    return res.status(500).json({ error: 'Failed to build frequency table' });
  }
}

async function getHeaderTable(_req, res) {
  try {
    const data = await fpGrowthService.debugHeaderTable();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth header table error:', error);
    return res.status(500).json({ error: 'Failed to build header table' });
  }
}

async function getTreeStructure(_req, res) {
  try {
    const data = await fpGrowthService.debugTreeStructure();
    return res.json(data);
  } catch (error) {
    console.error('FP-Growth tree structure error:', error);
    return res.status(500).json({ error: 'Failed to build FP-Tree structure' });
  }
}

module.exports = {
  getItemsets,
  getRules,
  getProcessedTransactions,
  getFrequencyTable,
  getHeaderTable,
  getTreeStructure,
};
