// js/diagnosis.js - Diagnosis and results rendering
window.allTransactions = [];
let renda = 12500;

function addTransactions(transacoes) {
  allTransactions.push(...transacoes);
}

function toCents(value) {
  // Normalize to integer cents to avoid floating point rounding drift.
  return Math.round((value || 0) * 100);
}

function summarizeTransactions() {
  // Total should reflect statement amount (includes credits/estornos).
  const totalCents = allTransactions.reduce((s, t) => s + toCents(t.valor), 0);
  // Ticket médio considera apenas compras (valores positivos).
  const purchaseCents = allTransactions.reduce((s, t) => s + (t.valor > 0 ? toCents(t.valor) : 0), 0);
  const purchaseCount = allTransactions.filter(t => t.valor > 0).length;
  const avgTicket = purchaseCount ? (purchaseCents / purchaseCount) / 100 : 0;
  // Contagem de transações exibida inclui estornos/ajustes.
  const count = allTransactions.length;
  const months = [...new Set(allTransactions.map(t => t.mesReferencia).filter(Boolean))];
  const monthsCount = months.length || 1;
  const total = totalCents / 100;
  const pct = Math.round(((totalCents / 100) / monthsCount / renda) * 100);
  return { total, count, avgTicket, months, pct };
}

function renderSummary() {
  const s = summarizeTransactions();
  const summaryGrid = document.getElementById('summaryGrid');
  summaryGrid.innerHTML = `
    <div class="summary-item">
      <span class="summary-label">Total gasto</span>
      <span class="summary-value">R$ ${s.total.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Transações</span>
      <span class="summary-value">${s.count}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Ticket médio</span>
      <span class="summary-value">R$ ${s.avgTicket.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Meses</span>
      <span class="summary-value">${s.months.length}</span>
    </div>
  `;
  // Update income
  document.getElementById('incomeTotal').textContent = `R$ ${s.total.toFixed(2)}`;
  document.getElementById('incomePct').textContent = `${s.pct}%`;
  document.getElementById('incomeBar').style.width = `${Math.min(s.pct, 100)}%`;
}

function renderTransactions() {
  const txBody = document.getElementById('txBody');
  txBody.innerHTML = '';
  allTransactions.forEach(tx => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tx.data}</td>
      <td>${tx.estabelecimento}</td>
      <td>${tx.categoria}</td>
      <td>****${tx.cartao || '0000'}</td>
      <td class="col-right">R$ ${tx.valor.toFixed(2)}</td>
    `;
    txBody.appendChild(row);
  });
  document.getElementById('txCount').textContent = `${allTransactions.length} transações`;
}
