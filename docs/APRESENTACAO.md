# Guia para montar a apresentação

Este arquivo é para quem vai montar os slides a partir deste repositório, seja uma pessoa ou um assistente de IA (como o Claude). Leia tudo antes de começar.

## O que é o projeto

Trabalho acadêmico da disciplina de **Defesa Cibernética**. O grupo criou um ambiente **fictício** de uma BPO financeira (empresa que terceiriza rotinas financeiras de clientes: contas a pagar e a receber, folha, conciliação) e inventariou como esse ambiente está protegido.

O inventário é dividido em cinco áreas de segurança:

| Área | Tema |
| --- | --- |
| GRC | Governança, riscos e conformidade |
| IAM | Identidades e acessos |
| Network | Rede e perímetro |
| Endpoint | Estações, e-mail e correções |
| SOC | Monitoramento e resposta |

Cada área é uma árvore de três níveis:

- **Sistema:** o que existe (ex.: Firewall de borda, com ferramenta, fornecedor e versão).
- **Configuração:** como esse sistema está ajustado (ex.: Zona do financeiro).
- **Regra:** o que passa a valer por causa da configuração (ex.: "Só HTTPS chega ao ERP").

Todo item tem um estado: **Em ordem**, **Atenção** ou **Pendente**.

A apresentação é para o professor. O objetivo é mostrar o ambiente, como cada área está protegida, onde estão os riscos (itens em atenção e pendentes) e o que falta fazer.

## Onde estão os dados

| Arquivo | O que tem | Use para |
| --- | --- | --- |
| `docs/inventario.md` | **Fonte principal.** Resumo por área, o **inventário de sistemas/ativos** (tipo, ferramenta, fornecedor, dono, localização, classificação dos dados, criticidade, estado), listas de pendentes e em atenção, e a árvore de cada área (sistema → configuração → regra). A data da exportação está no topo. | Números e nomes dos slides das áreas e do inventário. |
| `docs/documentacao.md` | Fichas de **políticas, infraestrutura, BIA e DRP**: área, status, versão, responsável, revisão e resumo, com o caminho do arquivo completo. | Slides de governança, infraestrutura e continuidade. |
| `docs/arquivos/` | Os documentos completos anexados (PDF, DOCX, imagens de diagrama), uma pasta por categoria. Leia-os para detalhar cada política, a infraestrutura, a BIA e o DRP. DOCX pode ser lido extraindo o texto (por exemplo, `unzip -p arquivo.docx word/document.xml`). | Detalhes e citações. |
| `docs/prints/` (se existir) | Prints anexados como evidência, um por item, com o nome do item no arquivo. | Slides de evidência. |
| `README.md` | Arquitetura da aplicação (Vercel + Neon) e como ela funciona. | Slide sobre a aplicação. |
| `referencia/ambiente-bpo.html` | Protótipo visual aprovado. | Identidade visual dos slides. |
| `db/seed.sql` | Versão **inicial** do inventário. | Não use para números: pode estar desatualizado. Use `docs/inventario.md`. |

**Não é preciso acessar o banco nem ter senhas.** Tudo que a apresentação precisa está nos arquivos acima. Se `docs/inventario.md` parecer desatualizado, peça ao dono do projeto para rodar `npm run exportar` e fazer commit.

## Estrutura sugerida (14 a 18 slides)

1. **Capa:** "Ambiente da BPO financeira: inventário de segurança", disciplina e grupo.
2. **Contexto:** o que é uma BPO financeira e por que ela é um alvo (dados financeiros de vários clientes, acesso a bancos e ERPs).
3. **Como organizamos:** as 5 áreas e o modelo Sistema → Configuração → Regra, com um exemplo real do inventário.
4. **Visão geral em números:** total de sistemas e itens e a distribuição por estado, por área (tabela "Resumo por área"; um gráfico de barras empilhadas funciona bem).
5. a 9. **Um slide por área** (GRC, IAM, Network, Endpoint, SOC), cada um com:
   - os sistemas da área (ferramenta e fornecedor);
   - 2 ou 3 configurações e regras mais importantes;
   - os pontos de atenção e pendências da área;
   - print de evidência, se houver.
10. **Políticas e infraestrutura:** quais políticas existem e o status de cada uma; como o ambiente está montado (use o diagrama, se houver).
11. **Inventário de sistemas e ativos:** quantos, por tipo e criticidade; destaque os de criticidade alta e dados restritos/confidenciais (tabela "Inventário de sistemas" em `docs/inventario.md`).
12. **Continuidade (BIA e DRP):** processos críticos, tempos de recuperação e como o ambiente se recupera de um desastre.
13. **Mapa de riscos:** os itens pendentes e em atenção, agrupados por área.
14. **Plano de ação:** o que fazer com cada pendência, priorizando as que expõem dados financeiros.
15. **A aplicação que guarda o inventário:** como foi construída e quais controles de segurança ela mesma usa (ver abaixo).
16. **Conclusão.**

### Controles de segurança da própria aplicação (para o slide 15)

A aplicação também foi feita com cuidados de segurança, o que combina com a disciplina:

- **Controle de acesso por perfil (RBAC):** Admin (tudo, inclusive usuários), Visualizador (vê e edita tudo, sem gerenciar usuários) e Coordenador (só a própria área). A regra é aplicada no servidor, e não só escondida na tela; sempre sobra pelo menos um Admin ativo.
- **Senhas com hash bcrypt.** A senha nunca fica guardada em texto.
- **Sessão em cookie `httpOnly`, `Secure` e `SameSite`**, com validade de 8 horas. Um usuário desativado perde o acesso na hora.
- **Mesma mensagem para e-mail inexistente e senha errada**, e tempo de resposta igual nos dois casos, para não revelar quais e-mails existem.
- **Consultas parametrizadas**, que impedem injeção de SQL.
- **Proteção contra CSRF:** a API só aceita pedidos em JSON (ou arquivos de tipos específicos).
- **Arquivos verificados:** só PDF, DOCX, PNG e JPG até 4 MB; a API confere os primeiros bytes (um executável renomeado para .pdf é recusado) e entrega o arquivo isolado (`Content-Security-Policy: sandbox`), só para quem tem acesso à área.
- **O banco garante a hierarquia** (um trigger impede, por exemplo, uma regra pendurada direto num sistema).
- **Nenhum segredo no repositório:** as variáveis de ambiente ficam fora do git.
- **Custo zero:** Vercel e Neon, ambos no plano gratuito.

## Na hora da apresentação

Para responder perguntas do professor ao vivo, use a aba **Árvore geral** da aplicação: busque o termo (ex.: "MFA", "firewall", "phishing"): as folhas encontradas acendem na árvore e a lista ao lado diz em que aba e em que caminho cada item está, com o botão para abrir a aba da área. A árvore ilustrada (tronco = BPO, galhos = áreas, frutos = sistemas, folhas = configurações e regras, cor = estado) também rende um ótimo print para o slide de visão geral.

## Regras para os slides

- **Os números precisam bater com `docs/inventario.md`.** Não arredonde nem invente.
- Deixe claro que o ambiente é **fictício** e que ferramentas, fornecedores e versões são exemplos.
- **O estado nunca deve depender só da cor:** escreva sempre "Em ordem", "Atenção" ou "Pendente" junto da cor.
- **Identidade visual** (a mesma da aplicação):
  - fontes Sora nos títulos e DM Sans no texto;
  - cor de destaque `#4f3fd9`;
  - estados em verde `#1f8a4c` (Em ordem), âmbar `#c27a0a` (Atenção) e vermelho `#c93a3a` (Pendente);
  - matiz de cada área, se quiser colorir por área: GRC 265, IAM 175, Network 215, Endpoint 22, SOC 340 (HSL).
- **Não coloque na apresentação** e-mails, nomes de usuários, a URL do banco nem qualquer variável de ambiente.
- Se o pedido não disser o formato (PowerPoint, Google Slides, PDF), pergunte antes de começar.
