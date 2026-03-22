// js/ui.js - UI interactions
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileQueueEl = document.getElementById('fileQueue');
const processBtn = document.getElementById('processBtn');
const logBox = document.getElementById('logBox');
const apiKeyInput = document.getElementById('apiKey');

let fileQueue = [];

function log(msg, type = 'dim') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = msg;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function setFiles(files) {
  fileQueue = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
  renderFileQueue();
  processBtn.disabled = fileQueue.length === 0;
}

function renderFileQueue() {
  fileQueueEl.innerHTML = '';
  fileQueue.forEach(file => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="file-name">${file.name}</span>
      <span class="file-meta">${Math.round(file.size / 1024)} KB</span>
      <span class="file-status">pendente</span>
    `;
    fileQueueEl.appendChild(li);
  });
}

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); setFiles(e.dataTransfer.files); });
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => setFiles(e.target.files));

const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', () => {
  // Reset
  allTransactions = [];
  cardRegistry = {};
  fileQueue = [];
  renderFileQueue();
  document.getElementById('screen-diagnosis').classList.add('hidden');
  document.getElementById('screen-upload').classList.remove('hidden');
});

processBtn.addEventListener('click', async () => {
  if (!apiKeyInput.value.trim()) {
    log('API Key necessária', 'err');
    return;
  }
  processBtn.disabled = true;
  log('Iniciando processamento...');
  // Process files
  for (const file of fileQueue) {
    try {
      log(`Processando ${file.name}`);
      const text = await extractPdfText(file);
      const parsed = parseTransactions(text);
      const { banco, ultimosDigitos, mesReferencia, transacoes } = parsed;
      log(`Encontradas ${transacoes.length} transações para ${banco} ****${ultimosDigitos}`);
      // Register card
      const regResult = registerCard(banco, ultimosDigitos, mesReferencia, transacoes);
      if (regResult.conflict) {
        // Handle conflict - for now, merge
        const added = mergeTransactions(regResult.existing, regResult.incoming);
        log(`Mescladas ${added} novas transações`);
      } // else already registered
    } catch (e) {
      log(`Erro em ${file.name}: ${e.message}`, 'err');
    }
  }
  log('Processamento concluído');
  // Collect all transactions
  window.allTransactions = Object.values(window.cardRegistry).flatMap(card => card.transacoes.map(tx => ({...tx, cartao: card.ultimosDigitos})));
  // Render diagnosis
  renderSummary();
  renderTransactions();
  // Switch to diagnosis screen
  document.getElementById('screen-upload').classList.add('hidden');
  document.getElementById('screen-diagnosis').classList.remove('hidden');
  processBtn.disabled = false;
});