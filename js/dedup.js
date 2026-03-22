// js/dedup.js - Deduplication logic
window.cardRegistry = {};

function registerCard(banco, ultimosDigitos, mesReferencia, transacoes) {
  const key = `${banco}|${ultimosDigitos}|${mesReferencia}`;
  if (cardRegistry[key]) {
    // Handle dedup
    return { conflict: true, existing: cardRegistry[key], incoming: { banco, ultimosDigitos, mesReferencia, transacoes } };
  } else {
    cardRegistry[key] = { banco, ultimosDigitos, mesReferencia, transacoes };
    return { conflict: false };
  }
}

function mergeTransactions(existing, incoming) {
  const existingKeys = new Set(existing.transacoes.map(t => `${t.data}|${t.estabelecimento}|${t.valor}`));
  const newTxs = incoming.transacoes.filter(t => !existingKeys.has(`${t.data}|${t.estabelecimento}|${t.valor}`));
  existing.transacoes.push(...newTxs);
  return newTxs.length;
}

function replaceTransactions(incoming) {
  const key = `${incoming.banco}|${incoming.ultimosDigitos}|${incoming.mesReferencia}`;
  cardRegistry[key] = incoming;
}