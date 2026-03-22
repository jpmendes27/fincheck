# fincheck

Diagnóstico de gastos via fatura PDF com suporte a IA (Claude).

## Como usar
1. Instale dependências: `npm install`
2. Rode o servidor: `npm run dev`
3. Abra `http://localhost:3000` no navegador.
4. Insira sua API Key do Anthropic.
5. Arraste ou selecione PDFs de fatura.
6. Clique em "Extrair e diagnosticar".
7. Veja o diagnóstico completo.

## Estrutura
- `index.html`: Interface principal.
- `css/style.css`: Estilos.
- `js/`: Módulos JavaScript (pdf.js, parser.js, dedup.js, diagnosis.js, ui.js).
- `package.json`: Configuração do projeto.

## Dependências
- pdf.js para extração de texto.
- Anthropic API para análise inteligente (opcional, mas recomendado para melhor precisão).

## Observações
- Funciona offline para parsing básico, mas IA melhora a extração.
- Suporte a múltiplos bancos.
