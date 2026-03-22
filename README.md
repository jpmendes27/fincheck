# fincheck

Diagnóstico de gastos com cartão de crédito e extratos, com suporte a upload de `PDF`, `CSV` e `OFX`.

## Como usar
1. Instale dependências: `npm install`
2. Rode o servidor: `npm run dev`
3. Abra `http://localhost:3000` no navegador.
4. Na landing page, clique em `Começar agora` ou `Analisar minha fatura grátis`.
5. Arraste ou selecione arquivos de fatura/extrato em `PDF`, `CSV` ou `OFX`.
6. Clique em `Analisar arquivos`.
6. Veja o diagnóstico completo.

## Estrutura
- `index.html`: landing page principal.
- `app/index.html`: aplicação de upload, processamento e relatório.
- `logo.svg`: logo/favicons usados no projeto.
- `package.json`: configuração para subir o app localmente.

## Observações
- O parser atual funciona localmente no navegador, sem dependência da Anthropic para gerar o diagnóstico.
- O app aceita múltiplos formatos de arquivo: `PDF`, `CSV` e `OFX`.
- Suporte a múltiplos bancos, com heurísticas específicas para formatos do Nubank e fallback para outros layouts.
