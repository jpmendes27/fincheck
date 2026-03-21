# fincheck

Um serviço para integração de dados de múltiplos cartões de crédito, fornecendo um diagnóstico completo dos gastos. Oferece visibilidade sobre onde você gasta mais, dias de maior uso, valores, e avalia a saúde do uso do cartão com base na sua renda.

## Funcionalidades

- **Upload de Faturas PDF**: Suporte para faturas de diversos bancos brasileiros (Nubank, Itaú, XP, Inter, C6, Bradesco, etc.)
- **Extração Inteligente**: Usa IA (Claude API) para analisar e categorizar transações automaticamente
- **Diagnóstico Completo**:
  - Total de gastos e transações
  - Ticket médio por compra
  - Comprometimento da renda mensal
  - Gastos por categoria
  - Estabelecimentos mais frequentes
  - Lista detalhada de todas as transações
- **Filtragem por Cartão**: Visualize dados de cartões específicos ou todos juntos
- **Ajuste de Renda**: Personalize o diagnóstico com sua renda mensal
- **Dedup Automático**: Evita duplicatas de transações entre faturas

## Como Usar

1. **Obtenha uma API Key**: Acesse [console.anthropic.com](https://console.anthropic.com) e gere uma chave API do Claude
2. **Abra o index.html**: Execute o arquivo em um navegador web
3. **Insira a API Key**: Cole sua chave no primeiro passo
4. **Faça Upload**: Arraste e solte PDFs de faturas de cartão
5. **Analise**: Clique em "Analisar faturas com Claude" para processar
6. **Explore o Diagnóstico**: Navegue pelas métricas e transações extraídas

## Requisitos

- Navegador web moderno com suporte a ES6+
- Chave API válida do Anthropic Claude
- PDFs de faturas de cartão de crédito

## Privacidade

- A API key é usada apenas localmente no navegador
- Os dados das faturas são processados client-side
- Nada é enviado para servidores externos exceto a API do Claude

## Desenvolvimento

Este é um protótipo web puro (HTML/CSS/JS) para validação do conceito. Futuras versões podem incluir:

- Backend para armazenamento seguro
- Integrações diretas com bancos (via APIs oficiais)
- Relatórios avançados e insights
- Aplicativo mobile
- Compartilhamento de dados com assessores financeiros