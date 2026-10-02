# Levita · Protótipo clicável

Protótipo navegável do **Levita**, app de escalas de voluntários para igrejas, usado em testes de usabilidade. Todos os dados são fictícios.

- **Explorar livremente:** abra `index.html`.
- **Gerar links de teste (facilitador):** `index.html?facilitador`
- **Link de um participante:** `index.html?p=P1&perfil=voluntario` (perfis: `admin`, `voluntario`, `lider`, `todos`)
- **Relatório:** `relatorio.html` (pede a chave do relatório)

Os resultados de cada tarefa (tempo, conclusão, toques e facilidade de 1 a 5) são enviados ao Supabase configurado em `config.js`. O banco só aceita inserções; a leitura exige a chave do relatório (veja `supabase-setup.sql`).
