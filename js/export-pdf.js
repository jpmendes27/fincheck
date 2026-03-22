/**
 * js/export-pdf.js — geração de relatório PDF no browser
 *
 * Dependência: jsPDF (carregado via CDN no index.html)
 * Uso: exportDiagnosisPDF(diagnosis, transactions, monthlyIncome)
 *
 * Recebe os mesmos objetos já computados pelo diagnosis.js —
 * não acessa o DOM nem inventa dados.
 */

'use strict';

// ── TOKENS DE DESIGN (espelha o CSS do fincheck) ──────────────────────────────

const PDF = {
  // Página
  PAGE_W: 210,   // A4 mm
  PAGE_H: 297,
  MARGIN: 14,
  COL_W:  182,   // PAGE_W - 2*MARGIN

  // Cores (RGB 0-255)
  BG:          [12,  13,  15],
  SURFACE:     [20,  21,  23],
  SURFACE2:    [28,  30,  34],
  BORDER:      [44,  47,  56],
  TEXT:        [233, 234, 237],
  TEXT2:       [148, 153, 166],
  TEXT3:       [92,  97,  112],
  ACCENT:      [184, 245, 90],
  GREEN:       [62,  207, 142],
  AMBER:       [240, 160, 48],
  RED:         [240, 80,  96],
  BLUE:        [74,  143, 255],
  PURPLE:      [155, 127, 244],
};

const PDF_CAT_COLORS = {
  'Alimentação': [240,160,48],  'Delivery':    [240,160,48],
  'Mercado':     [74,143,255],  'Assinaturas': [155,127,244],
  'Transporte':  [62,207,142],  'Combustível': [62,207,142],
  'Saúde':       [240,80,96],   'Farmácia':    [240,80,96],
  'Lazer':       [184,245,90],  'Viagem':      [240,80,96],
  'Hospedagem':  [240,80,96],   'Educação':    [74,143,255],
  'Outros':      [92,97,112],
};

// ── HELPERS INTERNOS ──────────────────────────────────────────────────────────

function rgb(doc, color) {
  doc.setTextColor(...color);
}

function fill(doc, color) {
  doc.setFillColor(...color);
}

function stroke(doc, color) {
  doc.setDrawColor(...color);
}

function fmtBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(value || 0);
}

function truncate(str, maxLen) {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

// Desenha um retângulo com fundo sólido (card)
function drawCard(doc, x, y, w, h, bgColor = PDF.SURFACE, borderColor = PDF.BORDER) {
  fill(doc, bgColor);
  stroke(doc, borderColor);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
}

// Label estilo "UPPERCASE MONO"
function labelText(doc, text, x, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  rgb(doc, PDF.TEXT3);
  doc.text(text.toUpperCase(), x, y);
}

// Valor grande
function valueText(doc, text, x, y, color = PDF.TEXT, size = 13) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  rgb(doc, color);
  doc.text(text, x, y);
}

// Texto body
function bodyText(doc, text, x, y, color = PDF.TEXT2, size = 7.5) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  rgb(doc, color);
  doc.text(text, x, y);
}

// Barra de progresso horizontal
function drawBar(doc, x, y, totalW, pct, color, h = 2) {
  // fundo
  fill(doc, PDF.SURFACE2);
  stroke(doc, PDF.SURFACE2);
  doc.roundedRect(x, y, totalW, h, h/2, h/2, 'F');
  // preenchimento
  const fillW = Math.max(1, totalW * Math.min(pct, 1));
  fill(doc, color);
  doc.roundedRect(x, y, fillW, h, h/2, h/2, 'F');
}

// Linha divisória
function divider(doc, y, x = PDF.MARGIN, w = PDF.COL_W) {
  stroke(doc, PDF.BORDER);
  doc.setLineWidth(0.15);
  doc.line(x, y, x + w, y);
}

// Nova página com fundo escuro
function newPage(doc) {
  doc.addPage();
  fill(doc, PDF.BG);
  doc.rect(0, 0, PDF.PAGE_W, PDF.PAGE_H, 'F');
  return PDF.MARGIN + 6; // cursor Y inicial
}

// Verifica se precisa de nova página e cria se necessário
function checkPage(doc, cursorY, needed = 20) {
  if (cursorY + needed > PDF.PAGE_H - PDF.MARGIN) {
    return newPage(doc);
  }
  return cursorY;
}

// ── SEÇÕES ────────────────────────────────────────────────────────────────────

function drawHeader(doc, diagnosis, months) {
  let y = PDF.MARGIN;

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  rgb(doc, PDF.ACCENT);
  doc.text('fincheck.', PDF.MARGIN, y + 7);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, PDF.TEXT3);
  doc.text('diagnóstico de gastos · gerado em ' + new Date().toLocaleDateString('pt-BR'), PDF.MARGIN, y + 13);

  // Período
  if (months && months.length) {
    const period = months.join(', ');
    doc.text(period, PDF.PAGE_W - PDF.MARGIN, y + 7, { align: 'right' });
  }

  divider(doc, y + 17);
  return y + 22;
}

function drawSummaryCards(doc, diagnosis, y) {
  const cardW = (PDF.COL_W - 9) / 4;
  const cardH = 22;
  const cards = [
    { label: 'Total gasto',   value: diagnosis.totalFormatted,      sub: `${diagnosis.months} ${diagnosis.months > 1 ? 'meses' : 'mês'}` },
    { label: 'Transações',    value: String(diagnosis.count),        sub: 'compras' },
    { label: 'Ticket médio',  value: diagnosis.avgTicketFormatted,   sub: 'por compra' },
    { label: 'Média mensal',  value: diagnosis.monthlyAvgFormatted,  sub: diagnosis.healthLabel, subColor: healthColor(diagnosis.commitment) },
  ];

  cards.forEach((card, i) => {
    const x = PDF.MARGIN + i * (cardW + 3);
    drawCard(doc, x, y, cardW, cardH);
    labelText(doc, card.label, x + 3, y + 5.5);
    valueText(doc, card.value, x + 3, y + 13, PDF.TEXT, 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    rgb(doc, card.subColor || PDF.TEXT3);
    doc.text(card.sub, x + 3, y + 18);
  });

  return y + cardH + 5;
}

function drawIncomeCard(doc, diagnosis, monthlyIncome, y) {
  const h = 28;
  drawCard(doc, PDF.MARGIN, y, PDF.COL_W, h);

  // Label
  labelText(doc, 'Comprometimento de renda', PDF.MARGIN + 3, y + 5.5);

  // Valor + percentual
  const color = healthColor(diagnosis.commitment);
  valueText(doc, diagnosis.monthlyAvgFormatted, PDF.MARGIN + 3, y + 12, color, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  rgb(doc, color);
  doc.text(`${diagnosis.commitment}%`, PDF.MARGIN + 3, y + 19);

  // Renda informada
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  rgb(doc, PDF.TEXT3);
  doc.text(`renda mensal: ${fmtBRL(monthlyIncome)}`, PDF.PAGE_W - PDF.MARGIN - 3, y + 12, { align: 'right' });

  // Barra
  const barX = PDF.MARGIN + 3;
  const barW = PDF.COL_W - 6;
  drawBar(doc, barX, y + 22, barW, diagnosis.commitment / 100, color, 2.5);

  return y + h + 5;
}

function drawScoreCard(doc, diagnosis, y) {
  const h = 30;
  drawCard(doc, PDF.MARGIN, y, PDF.COL_W, h);

  const color = healthColor(diagnosis.commitment);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  rgb(doc, color);
  doc.text(diagnosis.healthLabel, PDF.MARGIN + 3, y + 10);

  // Subtexto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  rgb(doc, PDF.TEXT2);

  const pct = diagnosis.commitment;
  let msg;
  if (pct < 30)      msg = `Você comprometeu ${pct}% da sua renda com cartões — dentro da faixa saudável.`;
  else if (pct < 60) msg = `Você comprometeu ${pct}% da sua renda com cartões — acima do recomendado de 30%.`;
  else               msg = `Você comprometeu ${pct}% da sua renda com cartões — nível crítico. Atenção imediata recomendada.`;

  const lines = doc.splitTextToSize(msg, PDF.COL_W - 30);
  doc.text(lines, PDF.MARGIN + 3, y + 18);

  // Círculo com score
  const cx = PDF.PAGE_W - PDF.MARGIN - 15;
  const cy = y + 15;
  stroke(doc, PDF.BORDER);
  fill(doc, PDF.SURFACE2);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, 11, 'FD');

  // Arco (simulated via text)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  rgb(doc, color);
  doc.text(`${pct}`, cx, cy + 1.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  rgb(doc, PDF.TEXT3);
  doc.text('%', cx, cy + 6, { align: 'center' });

  return y + h + 5;
}

function drawTwoColSection(doc, diagnosis, y) {
  const colW = (PDF.COL_W - 5) / 2;

  // ── Categorias ──
  const cats = diagnosis.categories.slice(0, 8);
  const catH = 14 + cats.length * 11 + 4;

  drawCard(doc, PDF.MARGIN, y, colW, catH);
  labelText(doc, 'Categorias', PDF.MARGIN + 3, y + 6);

  let cy = y + 12;
  const maxCat = cats[0]?.total || 1;
  for (const cat of cats) {
    const color = PDF_CAT_COLORS[cat.name] || PDF.TEXT3;
    bodyText(doc, truncate(cat.name, 18), PDF.MARGIN + 3, cy, PDF.TEXT, 7);
    bodyText(doc, `${cat.pct}%`, PDF.MARGIN + colW - 4, cy, PDF.TEXT2, 6.5);
    drawBar(doc, PDF.MARGIN + 3, cy + 1.5, colW - 6, cat.total / maxCat, color, 1.8);
    cy += 11;
  }

  // ── Top estabelecimentos ──
  const merchants = diagnosis.topMerchants.slice(0, 8);
  const mX = PDF.MARGIN + colW + 5;
  const merchH = catH;

  drawCard(doc, mX, y, colW, merchH);
  labelText(doc, 'Estabelecimentos', mX + 3, y + 6);

  let my = y + 12;
  const maxMerch = merchants[0]?.total || 1;
  for (const m of merchants) {
    bodyText(doc, truncate(m.name, 18), mX + 3, my, PDF.TEXT, 7);
    bodyText(doc, fmtBRL(m.total), mX + colW - 4, my, PDF.TEXT2, 6.5);
    drawBar(doc, mX + 3, my + 1.5, colW - 6, m.total / maxMerch, PDF.BLUE, 1.8);
    my += 11;
  }

  return y + Math.max(catH, merchH) + 5;
}

function drawTransactionsTable(doc, transactions, startY) {
  let y = startY;

  // Cabeçalho da seção
  y = checkPage(doc, y, 16);
  labelText(doc, 'Todas as transações', PDF.MARGIN, y);
  y += 6;

  // Header da tabela
  const cols = {
    data:  { x: PDF.MARGIN,      w: 20,  label: 'Data'           },
    name:  { x: PDF.MARGIN + 20, w: 72,  label: 'Estabelecimento'},
    cat:   { x: PDF.MARGIN + 92, w: 32,  label: 'Categoria'      },
    card:  { x: PDF.MARGIN + 124,w: 28,  label: 'Cartão'         },
    val:   { x: PDF.MARGIN + 152,w: 30,  label: 'Valor'          },
  };

  // Linha de header
  fill(doc, PDF.SURFACE2);
  doc.rect(PDF.MARGIN, y, PDF.COL_W, 7, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  rgb(doc, PDF.TEXT3);
  for (const col of Object.values(cols)) {
    doc.text(col.label.toUpperCase(), col.x + 2, y + 4.5);
  }
  y += 7;

  // Ordena por data descendente
  const sorted = [...transactions].sort((a, b) => {
    const parse = d => { if (!d) return 0; const [dd,mm,yyyy] = d.split('/'); return new Date(`${yyyy}-${mm}-${dd}`).getTime(); };
    return parse(b.data) - parse(a.data);
  });

  let rowAlt = false;
  for (const tx of sorted) {
    y = checkPage(doc, y, 8);

    // Fundo alternado
    if (rowAlt) {
      fill(doc, [22, 24, 28]);
      doc.rect(PDF.MARGIN, y, PDF.COL_W, 7, 'F');
    }
    rowAlt = !rowAlt;

    const isCredit = tx.valor < 0;
    const amtColor = isCredit ? PDF.GREEN : PDF.TEXT;
    const catColor = PDF_CAT_COLORS[tx.categoria] || PDF.TEXT3;

    // Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, PDF.TEXT2);
    doc.text(tx.data || '—', cols.data.x + 2, y + 4.5);

    // Estabelecimento
    rgb(doc, PDF.TEXT);
    doc.text(truncate(tx.estabelecimento, 34), cols.name.x + 2, y + 4.5);

    // Categoria — pill visual (bounding box colorido)
    const catLabel = tx.categoria || 'Outros';
    doc.setFontSize(5.5);
    rgb(doc, catColor);
    doc.text(catLabel, cols.cat.x + 2, y + 4.5);

    // Cartão
    doc.setFontSize(6);
    rgb(doc, PDF.TEXT3);
    const cardStr = tx._banco
      ? `${tx._banco} ····${tx._ultimos_digitos || '????'}`
      : '—';
    doc.text(truncate(cardStr, 16), cols.card.x + 2, y + 4.5);

    // Valor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    rgb(doc, amtColor);
    const amtStr = (isCredit ? '−' : '') + fmtBRL(Math.abs(tx.valor));
    doc.text(amtStr, cols.val.x + cols.val.w - 2, y + 4.5, { align: 'right' });

    y += 7;
  }

  return y;
}

function drawFooter(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    rgb(doc, PDF.TEXT3);
    doc.text(
      `fincheck · página ${i} de ${totalPages}`,
      PDF.PAGE_W / 2,
      PDF.PAGE_H - 6,
      { align: 'center' }
    );
  }
}

// ── HELPER DE COR ─────────────────────────────────────────────────────────────

function healthColor(pct) {
  if (pct < 30) return PDF.GREEN;
  if (pct < 60) return PDF.AMBER;
  return PDF.RED;
}

// ── EXPORTAÇÃO PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Gera e faz download do PDF de diagnóstico.
 *
 * @param {object} diagnosis      - Retorno de computeDiagnosis()
 * @param {Array}  transactions   - Retorno de flattenTransactions()
 * @param {number} monthlyIncome  - Renda mensal líquida
 * @param {string[]} months       - Meses cobertos (ex: ['Jan/2025', 'Fev/2025'])
 */
function exportDiagnosisPDF(diagnosis, transactions, monthlyIncome, months = []) {
  // jsPDF deve estar carregado via CDN
  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    alert('Erro: biblioteca jsPDF não carregada. Verifique o index.html.');
    return;
  }

  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Fundo escuro na primeira página
  fill(doc, PDF.BG);
  doc.rect(0, 0, PDF.PAGE_W, PDF.PAGE_H, 'F');

  let y = drawHeader(doc, diagnosis, months);
  y = drawSummaryCards(doc, diagnosis, y);
  y = drawIncomeCard(doc, diagnosis, monthlyIncome, y);
  y = drawScoreCard(doc, diagnosis, y);
  y = checkPage(doc, y, 60);
  y = drawTwoColSection(doc, diagnosis, y);
  y = checkPage(doc, y, 20);
  y = drawTransactionsTable(doc, transactions, y + 4);

  drawFooter(doc);

  // Nome do arquivo com data
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`fincheck-diagnostico-${dateStr}.pdf`);
}

window.exportDiagnosisPDF = exportDiagnosisPDF;
