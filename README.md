# Ambiente BPO: inventário de cibersegurança

Aplicação web de um projeto acadêmico de Defesa Cibernética que inventaria a segurança de um ambiente **fictício** de BPO financeira, dividido em cinco áreas: GRC, IAM, Network, Endpoint e SOC.

## O que faz

- Organiza cada área como uma árvore **Sistema → Configuração → Regra**, com estado (Em ordem, Atenção, Pendente) e print de evidência por item.
- Visão geral com números por área e uma árvore ilustrada com busca, para achar rápido qualquer controle.
- Cadastro de documentos (políticas, infraestrutura, BIA e DRP) com upload de arquivos.
- Leitura opcional de arquivos com IA (Gemini): sugere a ficha do documento ou a lista de ativos, e a pessoa confere antes de salvar.
- Perfis de acesso: Admin, Visualizador e Coordenador (restrito à própria área).
- Exporta inventário e documentação para Markdown em `docs/`, base para os slides da apresentação.

## Destaques técnicos

- **RBAC aplicado no servidor**: toda consulta filtra pelas áreas do usuário; coordenador de outra área recebe 403. Sempre sobra ao menos um Admin ativo.
- **Integridade no banco**: triggers garantem a hierarquia (configuração pendurada em sistema, regra em configuração, mesma área).
- **Autenticação**: senhas com bcrypt, sessão em cookie `HttpOnly`/`Secure`/`SameSite` assinado com `jose` (8 h), mesma resposta e tempo para e-mail inexistente e senha errada.
- **Uploads seguros**: só PDF, DOCX, PNG e JPG até 4 MB, conferidos pela assinatura dos bytes e entregues com `Content-Security-Policy: sandbox`.
- **Cabeçalhos de segurança** (CSP, HSTS, `X-Frame-Options`, `nosniff`), consultas parametrizadas e API só JSON (proteção contra CSRF).
- DOCX e XLSX lidos sem biblioteca extra; troca automática de modelo do Gemini quando um está sobrecarregado.

## Stack

Vite · React 19 · TypeScript (estrito) · React Router · Funções serverless da Vercel · Postgres (Neon) · bcryptjs · jose · Google Gemini (opcional) · oxlint.

## Como rodar

Requer Node 22.18+.

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e SESSAO_SEGREDO
npm run db:migrar            # cria as tabelas
npm run db:seed              # carrega os 71 itens de exemplo
npm run criar-admin -- voce@exemplo.com "Seu Nome"   # senha pedida no terminal
npm run dev                  # http://localhost:5173 (interface + API)
```

Variáveis: `DATABASE_URL`, `SESSAO_SEGREDO` (mín. 32 caracteres) e, opcionais, `GEMINI_API_KEY` e `GEMINI_MODELO`. Não há cadastro público: os demais usuários são criados pela aba Admin.

## Estrutura

```
src/            interface React (paginas/, componentes/, lib/, estilos/)
api/            funções da API, uma por rota; _lib/ com banco, sessão e validação
db/             migrações SQL e seed dos 71 itens fictícios
scripts/        migrar, seed, criar-admin e exportar
docs/           inventário exportado e guia da apresentação
referencia/     protótipo visual original (arquivo único)
```
