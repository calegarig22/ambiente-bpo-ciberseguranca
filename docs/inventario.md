# Inventário do ambiente da BPO financeira

> Gerado automaticamente por `npm run exportar` em 12/10/2026, 23:18:02 (horário de Brasília), a partir do banco da aplicação.
> Não edite à mão: as mudanças se perdem na próxima exportação.
> Ambiente **fictício**, criado para o projeto acadêmico de Defesa Cibernética. Ferramentas, fornecedores e versões são exemplos.

## Como ler

- Cada área é uma árvore de três níveis: **Sistema** (o que existe) → **Configuração** (como está ajustado) → **Regra** (o que passa a valer por causa da configuração).
- Estados: **Em ordem** (ok), **Atenção** (funciona, mas tem ressalva) e **Pendente** (ainda não está como deveria).
- "📎 com print" indica que existe um print anexado como evidência.

## Resumo por área

| Área | Descrição | Sistemas | Itens | Em ordem | Atenção | Pendente |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| GRC | Governança, riscos e conformidade | 4 | 14 | 6 | 5 | 3 |
| IAM | Identidades e acessos | 3 | 14 | 7 | 4 | 3 |
| Network | Rede e perímetro | 4 | 14 | 9 | 2 | 3 |
| Endpoint | Estações, e-mail e correções | 4 | 15 | 6 | 7 | 2 |
| SOC | Monitoramento e resposta | 4 | 14 | 5 | 5 | 4 |
| **Total** | | **19** | **71** | **33** | **23** | **15** |

## Inventário de sistemas

| Área | Sistema | Ferramenta | Fornecedor | Versão | Estado |
| --- | --- | --- | --- | --- | --- |
| GRC | Plataforma de GRC | ServiceNow GRC | ServiceNow | 2024 | Em ordem |
| GRC | Plataforma de treinamento | KnowBe4 | KnowBe4 | SaaS | Em ordem |
| GRC | Repositório de políticas | SharePoint | Microsoft | Online | Em ordem |
| GRC | Gestão de fornecedores | Questionário em planilha | Interno | v1 | Atenção |
| IAM | Provedor de identidade com SSO | Microsoft Entra ID | Microsoft | P1 | Em ordem |
| IAM | Cofre de acessos privilegiados | CyberArk | CyberArk | 14 | Atenção |
| IAM | Ciclo de vida de contas | Entra ID Governance | Microsoft | SaaS | Em ordem |
| Network | Firewall de borda | FortiGate | Fortinet | FortiOS 7.4 | Em ordem |
| Network | VPN corporativa | FortiClient VPN | Fortinet | 7.2 | Em ordem |
| Network | Switches e Wi-Fi | Meraki | Cisco | MR 30 | Atenção |
| Network | DNS e proxy web | Umbrella | Cisco | SaaS | Pendente |
| Endpoint | Proteção das estações (EDR) | Falcon | CrowdStrike | Sensor 7 | Em ordem |
| Endpoint | Gestão de dispositivos (MDM) | Intune | Microsoft | SaaS | Atenção |
| Endpoint | Gestão de correções | WSUS e Intune | Microsoft | Windows Server | Atenção |
| Endpoint | Segurança de e-mail | Defender for Office 365 | Microsoft | Plano 2 | Em ordem |
| SOC | SIEM | Enterprise Security | Splunk | 9 | Atenção |
| SOC | Plataforma de resposta (SOAR) | Splunk SOAR | Splunk | 6 | Pendente |
| SOC | Gestão de incidentes | Jira Service Management | Atlassian | Cloud | Em ordem |
| SOC | Varredura de vulnerabilidades | Nessus | Tenable | 10 | Em ordem |

## Itens pendentes (15)

- **GRC** · Regra: Treinamento vencido bloqueia acesso a dados de clientes
- **GRC** · Regra: Política sem revisão em 12 meses vira pendência automática
- **GRC** · Configuração: Questionário de due diligence
- **IAM** · Regra: Administrador só acessa com sessão gravada
- **IAM** · Regra: Conta sem uso por 90 dias é desativada
- **IAM** · Configuração: Revisão semestral de acessos
- **Network** · Sistema: DNS e proxy web
- **Network** · Configuração: Bloqueio de categorias de risco
- **Network** · Regra: Download de executáveis é bloqueado
- **Endpoint** · Regra: Notebook sem criptografia não acessa dados financeiros
- **Endpoint** · Regra: Vulnerabilidade crítica é corrigida em 7 dias
- **SOC** · Regra: Login impossível (dois países em 1 hora) gera alerta alto
- **SOC** · Sistema: Plataforma de resposta (SOAR)
- **SOC** · Configuração: Playbook de phishing
- **SOC** · Regra: Alerta crítico é tratado em até 15 minutos

## Itens em atenção (23)

- **GRC** · Regra: Exceção de política exige aprovação do comitê
- **GRC** · Configuração: Simulação de phishing mensal
- **GRC** · Configuração: Ciclo de revisão anual
- **GRC** · Sistema: Gestão de fornecedores
- **GRC** · Regra: Fornecedor crítico precisa de cláusula de LGPD no contrato
- **IAM** · Regra: Login fora do Brasil é bloqueado
- **IAM** · Sistema: Cofre de acessos privilegiados
- **IAM** · Configuração: Rotação automática de senhas
- **IAM** · Regra: Conta de desligado é desativada em até 1 hora
- **Network** · Configuração: Inspeção de tráfego (IPS)
- **Network** · Sistema: Switches e Wi-Fi
- **Endpoint** · Regra: Máquina infectada é isolada automaticamente
- **Endpoint** · Sistema: Gestão de dispositivos (MDM)
- **Endpoint** · Configuração: Criptografia de disco
- **Endpoint** · Sistema: Gestão de correções
- **Endpoint** · Configuração: Janela de atualização semanal
- **Endpoint** · Configuração: Proteção contra falsificação de domínio
- **Endpoint** · Regra: E-mail que falha no DMARC é rejeitado
- **SOC** · Sistema: SIEM
- **SOC** · Configuração: Fontes de log conectadas
- **SOC** · Configuração: Regras de detecção
- **SOC** · Regra: Incidente grave aciona o comitê em até 1 hora
- **SOC** · Regra: Falha crítica sem correção vira incidente

## Árvores por área

### GRC: Governança, riscos e conformidade

14 itens: 6 em ordem, 5 em atenção, 3 pendentes.

- **Sistema:** Plataforma de GRC — _Em ordem_ (ServiceNow GRC · ServiceNow · 2024)
  Registro de riscos, políticas e auditorias
  - **Configuração:** Matriz de riscos 5x5 — _Em ordem_
    Probabilidade vezes impacto, revisão trimestral
    - **Regra:** Risco alto exige plano de tratamento em 30 dias — _Em ordem_
    - **Regra:** Exceção de política exige aprovação do comitê — _Atenção_
- **Sistema:** Plataforma de treinamento — _Em ordem_ (KnowBe4 · KnowBe4 · SaaS)
  Treinamentos obrigatórios e simulações de phishing
  - **Configuração:** Trilha obrigatória de segurança — _Em ordem_
    No onboarding e a cada 12 meses para todos
    - **Regra:** Treinamento vencido bloqueia acesso a dados de clientes — _Pendente_
  - **Configuração:** Simulação de phishing mensal — _Atenção_
    Meta de cliques abaixo de 5 por cento
- **Sistema:** Repositório de políticas — _Em ordem_ (SharePoint · Microsoft · Online)
  Versões vigentes e aceite dos colaboradores
  - **Configuração:** Ciclo de revisão anual — _Atenção_
    Toda política revisada a cada 12 meses
    - **Regra:** Política sem revisão em 12 meses vira pendência automática — _Pendente_
- **Sistema:** Gestão de fornecedores — _Atenção_ (Questionário em planilha · Interno · v1)
  Avaliação de segurança de terceiros
  - **Configuração:** Questionário de due diligence — _Pendente_
    Aplicado antes da contratação e renovado a cada ano
    - **Regra:** Fornecedor crítico precisa de cláusula de LGPD no contrato — _Atenção_

### IAM: Identidades e acessos

14 itens: 7 em ordem, 4 em atenção, 3 pendentes.

- **Sistema:** Provedor de identidade com SSO — _Em ordem_ (Microsoft Entra ID · Microsoft · P1)
  Login único para todos os sistemas
  - **Configuração:** MFA obrigatório — _Em ordem_
    App autenticador ou chave FIDO2, sem SMS
    - **Regra:** ERP e banco só acessam com MFA — _Em ordem_
    - **Regra:** Login fora do Brasil é bloqueado — _Atenção_
  - **Configuração:** Acesso condicional — _Em ordem_
    Dispositivo gerenciado exigido para dados financeiros
- **Sistema:** Cofre de acessos privilegiados — _Atenção_ (CyberArk · CyberArk · 14)
  Senhas de administradores e contas de serviço
  - **Configuração:** Rotação automática de senhas — _Atenção_
    Troca a cada 30 dias e após cada uso
    - **Regra:** Administrador só acessa com sessão gravada — _Pendente_
- **Sistema:** Ciclo de vida de contas — _Em ordem_ (Entra ID Governance · Microsoft · SaaS)
  Criação e desligamento de acessos a partir do RH
  - **Configuração:** Integração com o sistema de RH — _Em ordem_
    Admissão e desligamento disparam criação e remoção
    - **Regra:** Conta de desligado é desativada em até 1 hora — _Atenção_
    - **Regra:** Conta sem uso por 90 dias é desativada — _Pendente_
  - **Configuração:** Revisão semestral de acessos — _Pendente_
    Gestores recertificam o acesso de cada equipe
    - **Regra:** Acesso conforme o perfil da função, sem acúmulo — _Em ordem_

### Network: Rede e perímetro

14 itens: 9 em ordem, 2 em atenção, 3 pendentes.

- **Sistema:** Firewall de borda — _Em ordem_ (FortiGate · Fortinet · FortiOS 7.4)
  Controle de entrada e saída da rede
  - **Configuração:** Zona do financeiro — _Em ordem_
    Rede isolada para ERP, folha e conciliação
    - **Regra:** Só HTTPS chega ao ERP — _Em ordem_
    - **Regra:** Zonas não se comunicam sem regra explícita — _Em ordem_
  - **Configuração:** Inspeção de tráfego (IPS) — _Atenção_
    Assinaturas atualizadas diariamente
- **Sistema:** VPN corporativa — _Em ordem_ (FortiClient VPN · Fortinet · 7.2)
  Acesso remoto de colaboradores
  - **Configuração:** Túnel com autenticação forte — _Em ordem_
    Certificado do dispositivo mais MFA
    - **Regra:** Sem VPN, sem acesso aos sistemas internos — _Em ordem_
- **Sistema:** Switches e Wi-Fi — _Atenção_ (Meraki · Cisco · MR 30)
  Rede local dos escritórios
  - **Configuração:** Wi-Fi de visitantes separado — _Em ordem_
    Rede isolada, sem rota para a rede interna
    - **Regra:** Visitante nunca alcança a rede corporativa — _Em ordem_
- **Sistema:** DNS e proxy web — _Pendente_ (Umbrella · Cisco · SaaS)
  Filtro de navegação e resolução de nomes
  - **Configuração:** Bloqueio de categorias de risco — _Pendente_
    Phishing, malware e apostas
    - **Regra:** Download de executáveis é bloqueado — _Pendente_

### Endpoint: Estações, e-mail e correções

15 itens: 6 em ordem, 7 em atenção, 2 pendentes.

- **Sistema:** Proteção das estações (EDR) — _Em ordem_ (Falcon · CrowdStrike · Sensor 7)
  Detecta e contém ameaças nos computadores
  - **Configuração:** Modo de prevenção ativo — _Em ordem_
    Bloqueia, e não só alerta
    - **Regra:** Máquina infectada é isolada automaticamente — _Atenção_
- **Sistema:** Gestão de dispositivos (MDM) — _Atenção_ (Intune · Microsoft · SaaS)
  Inventário e política dos notebooks
  - **Configuração:** Criptografia de disco — _Atenção_
    BitLocker em todos os notebooks
    - **Regra:** Notebook sem criptografia não acessa dados financeiros — _Pendente_
  - **Configuração:** Bloqueio de tela — _Em ordem_
    Após 5 minutos de inatividade
- **Sistema:** Gestão de correções — _Atenção_ (WSUS e Intune · Microsoft · Windows Server)
  Atualização de sistema e aplicativos
  - **Configuração:** Janela de atualização semanal — _Atenção_
    Correções críticas em até 7 dias
    - **Regra:** Vulnerabilidade crítica é corrigida em 7 dias — _Pendente_
- **Sistema:** Segurança de e-mail — _Em ordem_ (Defender for Office 365 · Microsoft · Plano 2)
  Filtro contra phishing e anexos maliciosos
  - **Configuração:** Análise de anexos em ambiente isolado — _Em ordem_
    Anexos desconhecidos abrem em área separada
    - **Regra:** Anexo com macro é bloqueado — _Em ordem_
  - **Configuração:** Proteção contra falsificação de domínio — _Atenção_
    SPF, DKIM e DMARC configurados
    - **Regra:** E-mail que falha no DMARC é rejeitado — _Atenção_

### SOC: Monitoramento e resposta

14 itens: 5 em ordem, 5 em atenção, 4 pendentes.

- **Sistema:** SIEM — _Atenção_ (Enterprise Security · Splunk · 9)
  Reúne e correlaciona os logs do ambiente
  - **Configuração:** Fontes de log conectadas — _Atenção_
    Firewall, EDR, identidade e e-mail
    - **Regra:** Logs ficam retidos por 12 meses — _Em ordem_
  - **Configuração:** Regras de detecção — _Atenção_
    Login anômalo, movimento lateral e exfiltração
    - **Regra:** Login impossível (dois países em 1 hora) gera alerta alto — _Pendente_
- **Sistema:** Plataforma de resposta (SOAR) — _Pendente_ (Splunk SOAR · Splunk · 6)
  Automatiza a resposta aos alertas
  - **Configuração:** Playbook de phishing — _Pendente_
    Isola o e-mail, reinicia a senha e abre chamado
    - **Regra:** Alerta crítico é tratado em até 15 minutos — _Pendente_
- **Sistema:** Gestão de incidentes — _Em ordem_ (Jira Service Management · Atlassian · Cloud)
  Registro e acompanhamento dos incidentes
  - **Configuração:** Classificação de severidade — _Em ordem_
    Quatro níveis, com prazo de resposta por nível
    - **Regra:** Incidente grave aciona o comitê em até 1 hora — _Atenção_
- **Sistema:** Varredura de vulnerabilidades — _Em ordem_ (Nessus · Tenable · 10)
  Descoberta de falhas em servidores e estações
  - **Configuração:** Varredura semanal autenticada — _Em ordem_
    Todos os servidores e uma amostra das estações
    - **Regra:** Falha crítica sem correção vira incidente — _Atenção_
