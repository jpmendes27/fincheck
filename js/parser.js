// js/parser.js - Transaction parsing from PDF text
function parseTransactions(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  // Extract card info
  let banco = null;
  let ultimosDigitos = null;
  let mesReferencia = null;

  for (const line of lines) {
    // Banco
    if (!banco) {
      const bancoMatch = line.match(/\b(Banco|Banco do Brasil|Itaú|Bradesco|Santander|Nubank|Inter|C6|PicPay|Next|Digio|Will|Pan|Original|PagBank|Mercado Pago|Caixa Econômica|Banrisul|Banestes|Sicoob|Sicredi|Unicred|Credisan|Bancoob|Agibank|Modalmais|Daycoval|Pine|Juno|BS2|Banco Topázio|Banco Votorantim|Banco Safra|Banco Modal|Banco C6|Banco Inter|Banco Neon|Banco Original|Banco Next|Banco Digio|Banco Will|Banco Pan|Banco PagBank|Banco Mercado Pago|Banco Caixa|Banco Banrisul|Banco Banestes|Banco Sicoob|Banco Sicredi|Banco Unicred|Banco Credisan|Banco Bancoob|Banco Agibank|Banco Modalmais|Banco Daycoval|Banco Pine|Banco Juno|Banco BS2|Banco Topázio|Banco Votorantim|Banco Safra)\b/i);
      if (bancoMatch) banco = bancoMatch[1];
    }
    // Últimos dígitos
    if (!ultimosDigitos) {
      const digitsMatch = line.match(/\b(\d{4})\b(?=\s*$|\s+(?:referência|mês|ano))/i) || line.match(/(\d{4})$/);
      if (digitsMatch) ultimosDigitos = digitsMatch[1];
    }
    // Mês referência
    if (!mesReferencia) {
      const refMatch = line.match(/\b(referência|referente a?|mês)\s*(\d{1,2})[\/\-](\d{4})\b/i);
      if (refMatch) mesReferencia = `${refMatch[2].padStart(2, '0')}/${refMatch[3]}`;
    }
  }

  const dateRegex = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
  const valueRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\b/;
  const negativeValueRegex = /-\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\b/;
  const stopWords = /\b(total|fatura anterior|pagamento|encargos|juros|saldo|pli|dinheiro|cielo|tef|cnpj|cpf|loja)\b/i;

  const categorias = {
    'mercado': 'Mercado', 'supermercado': 'Mercado', 'extra': 'Mercado', 'carrefour': 'Mercado',
    'uber': 'Transporte', '99': 'Transporte', 'taxi': 'Transporte', 'onibus': 'Transporte',
    'posto': 'Combustível', 'shell': 'Combustível', 'petrobras': 'Combustível', 'ipiranga': 'Combustível',
    'netflix': 'Assinaturas', 'spotify': 'Assinaturas', 'amazon': 'Assinaturas', 'prime': 'Assinaturas',
    'farmacia': 'Farmácia', 'drogasil': 'Farmácia', 'drogaria': 'Farmácia', 'pacheco': 'Farmácia',
    'hospital': 'Saúde', 'clinica': 'Saúde', 'medico': 'Saúde', 'odontologico': 'Saúde',
    'restaurante': 'Alimentação', 'mcdonalds': 'Alimentação', 'burger': 'Alimentação', 'pizzaria': 'Alimentação',
    'shopping': 'Lazer', 'cinema': 'Lazer', 'teatro': 'Lazer', 'show': 'Lazer',
    'hotel': 'Hospedagem', 'pousada': 'Hospedagem', 'airbnb': 'Hospedagem',
    'escola': 'Educação', 'curso': 'Educação', 'faculdade': 'Educação', 'livraria': 'Educação'
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (stopWords.test(line)) continue;

    const dateMatch = line.match(dateRegex);
    const valueMatch = line.match(valueRegex) || line.match(negativeValueRegex);
    if (!dateMatch || !valueMatch) continue;

    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    let year = dateMatch[3] ? Number(dateMatch[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const data = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

    let valor = Number(valueMatch[1].replace(/\./g, '') + '.' + valueMatch[2]);
    if (line.includes('-') && !line.trim().startsWith('-')) {
      valor = -Math.abs(valor);
    }

    const dateEnd = dateMatch.index + dateMatch[0].length;
    const valueStart = valueMatch.index;
    let estabelecimento = line.substring(dateEnd, valueStart).trim();

    if (estabelecimento.length < 3 && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (!stopWords.test(nextLine)) {
        estabelecimento = nextLine;
      }
    }

    estabelecimento = estabelecimento
      .replace(/\s+/g, ' ')
      .replace(/[^\wÀ-ÿ\s]/g, '')
      .trim();

    if (estabelecimento.length < 3) continue;

    let categoria = 'Outros';
    const lowerEstab = estabelecimento.toLowerCase();
    for (const [keyword, cat] of Object.entries(categorias)) {
      if (lowerEstab.includes(keyword)) {
        categoria = cat;
        break;
      }
    }

    if (Math.abs(valor) < 0.5) continue;

    transactions.push({
      data,
      estabelecimento,
      valor,
      categoria,
      parcelado: false,
      parcela_atual: null,
      total_parcelas: null
    });
  }

  // Fallback
  if (transactions.length === 0) {
    const fallbackRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\D{1,30}([\wÀ-ÿ\.\-\s&]{4,70})\s+(?:R\$\s*)?(\-?\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/gi;
    let m;
    while ((m = fallbackRegex.exec(text)) !== null) {
      const dataRaw = m[1];
      const estabelecimento = m[2].trim().replace(/\s+/g, ' ');
      const valueStr = m[3].replace(/\./g, '') + '.' + m[4];
      let valor = parseFloat(valueStr);

      if (Math.abs(valor) < 0.5 || estabelecimento.length < 3) continue;

      const dateParts = dataRaw.split('/');
      let day = Number(dateParts[0]);
      let month = Number(dateParts[1]);
      let year = dateParts[2] ? Number(dateParts[2]) : new Date().getFullYear();
      if (year < 100) year += 2000;
      const data = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

      let categoria = 'Outros';
      const lowerEstab = estabelecimento.toLowerCase();
      for (const [keyword, cat] of Object.entries(categorias)) {
        if (lowerEstab.includes(keyword)) { categoria = cat; break; }
      }

      transactions.push({
        data,
        estabelecimento,
        valor,
        categoria,
        parcelado: false,
        parcela_atual: null,
        total_parcelas: null
      });
    }
  }

  return {
    banco: banco || 'Desconhecido',
    ultimosDigitos: ultimosDigitos || '0000',
    mesReferencia: mesReferencia || '00/0000',
    transacoes: transactions
  };
}