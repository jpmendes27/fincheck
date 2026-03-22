# fincheck

Um serviço para integração de dados de múltiplos cartões de crédito, fornecendo um diagnóstico completo dos gastos. Oferece visibilidade sobre onde você gasta mais, dias de maior uso, valores, e avalia a saúde do uso do cartão com base na sua renda.

## Funcionalidades

- **Upload de Faturas PDF**: Suporte para faturas de diversos bancos brasileiros (Nubank, Itaú, XP, Inter, C6, Bradesco, etc.)
- **Extração Inteligente**: Usa regex e padrões para extrair transações reais dos PDFs
- **Categorização Automática**: Classifica transações por categoria baseada no estabelecimento
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

## Como Funciona a Extração

O sistema analisa o texto extraído dos PDFs usando padrões regex para identificar:

- **Datas**: Padrões DD/MM ou DD/MM/AAAA
- **Valores**: R$ XXX,XX ou apenas XXX,XX (positivos e negativos)
- **Estabelecimentos**: Texto entre data e valor
- **Categorias**: Baseadas em palavras-chave no nome do estabelecimento

Se não conseguir extrair transações estruturadas, tenta uma abordagem mais simples procurando apenas por valores monetários.

## Como Usar

1. **Abra o index.html**: Execute o arquivo em um navegador web
2. **Faça Upload**: Arraste e solte PDFs de faturas de cartão
3. **Analise**: Clique em "Analisar faturas" para processar
4. **Explore o Diagnóstico**: Navegue pelas métricas e transações extraídas

## Requisitos

- Navegador web moderno com suporte a ES6+
- PDFs de faturas de cartão de crédito

## Privacidade

- Os dados das faturas são processados localmente no navegador
- Não há envio de dados para servidores externos
- Extração feita com algoritmos client-side usando regex
- Seus dados financeiros permanecem no seu dispositivo

## Desenvolvimento

Este é um protótipo web puro (HTML/CSS/JS) para validação do conceito. Futuras versões podem incluir:

- Backend para armazenamento seguro
- Integrações diretas com bancos (via APIs oficiais)
- Relatórios avançados e insights
- Aplicativo mobile
- Compartilhamento de dados com assessores financeiros
