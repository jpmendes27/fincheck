# fincheck

Diagnóstico de gastos via fatura PDF com suporte a IA (Claude).

## Como usar
1. Instale dependências: `npm install`
2. Rode o servidor: `npm run dev`
3. Abra `http://localhost:3000` no navegador.
4. Arraste ou selecione PDFs de fatura.
5. Clique em `Analisar faturas com Claude`.
6. Veja o diagnóstico completo.

## Estrutura
- `index.html`: aplicação principal, com HTML, CSS e JavaScript embutidos.
- `package.json`: configuração para subir o app localmente.

## Observações
- A versão principal atual está concentrada em `index.html`.
- A chave da Anthropic está embutida no frontend nesta versão, então qualquer pessoa com acesso ao app no navegador consegue inspecioná-la.
- Suporte a múltiplos bancos.
