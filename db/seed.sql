-- Seed: os 71 itens do protótipo (referencia/ambiente-bpo.html).
-- Gerado a partir do array SEED. Os ids curtos do protótipo (g1, i4...) viraram
-- UUIDs fixos, e o id curto original fica no comentário ao fim de cada linha.
-- A ordem das linhas importa: todo pai aparece antes dos filhos.
-- Rodar de novo não duplica nada (on conflict do nothing).
-- Itens por área: GRC 14, IAM 14, Network 14, Endpoint 15, SOC 14.

insert into itens (id, area, tipo, nome, detalhe, estado, pai_id, ferramenta, fornecedor, versao, ordem) values
  ('efb28d62-783d-47e6-a258-3840f00a5a0a', 'GRC', 'sistema', 'Plataforma de GRC', 'Registro de riscos, políticas e auditorias', 'ok', null, 'ServiceNow GRC', 'ServiceNow', '2024', 0), -- g1
  ('38bf8b3c-ceeb-483c-b323-7f6eb0428cb8', 'GRC', 'config', 'Matriz de riscos 5x5', 'Probabilidade vezes impacto, revisão trimestral', 'ok', 'efb28d62-783d-47e6-a258-3840f00a5a0a', '', '', '', 1), -- g2
  ('9173db7d-d747-47fa-bd68-55323a3cf60c', 'GRC', 'regra', 'Risco alto exige plano de tratamento em 30 dias', '', 'ok', '38bf8b3c-ceeb-483c-b323-7f6eb0428cb8', '', '', '', 2), -- g3
  ('f5a41e56-62aa-40d0-bce8-82114aa0f2dd', 'GRC', 'regra', 'Exceção de política exige aprovação do comitê', '', 'atencao', '38bf8b3c-ceeb-483c-b323-7f6eb0428cb8', '', '', '', 3), -- g4
  ('af4a339e-5c81-4468-afa3-d29e033a7429', 'GRC', 'sistema', 'Plataforma de treinamento', 'Treinamentos obrigatórios e simulações de phishing', 'ok', null, 'KnowBe4', 'KnowBe4', 'SaaS', 4), -- g5
  ('6213a73e-da18-4383-87ed-865fc943b892', 'GRC', 'config', 'Trilha obrigatória de segurança', 'No onboarding e a cada 12 meses para todos', 'ok', 'af4a339e-5c81-4468-afa3-d29e033a7429', '', '', '', 5), -- g6
  ('38d601f7-3585-4bd4-8a8f-6408ae1cba03', 'GRC', 'regra', 'Treinamento vencido bloqueia acesso a dados de clientes', '', 'pendente', '6213a73e-da18-4383-87ed-865fc943b892', '', '', '', 6), -- g7
  ('9c4cc446-558e-4885-9560-b8484207c1a5', 'GRC', 'config', 'Simulação de phishing mensal', 'Meta de cliques abaixo de 5 por cento', 'atencao', 'af4a339e-5c81-4468-afa3-d29e033a7429', '', '', '', 7), -- g8
  ('9a50f681-0bc7-4d61-8378-df53e299b5aa', 'GRC', 'sistema', 'Repositório de políticas', 'Versões vigentes e aceite dos colaboradores', 'ok', null, 'SharePoint', 'Microsoft', 'Online', 8), -- g9
  ('a1ce2f36-7c19-4ec0-bad6-4e405701cb0a', 'GRC', 'config', 'Ciclo de revisão anual', 'Toda política revisada a cada 12 meses', 'atencao', '9a50f681-0bc7-4d61-8378-df53e299b5aa', '', '', '', 9), -- g10
  ('613c6d3b-4712-42d4-9d7f-5b8bc5f5f9ce', 'GRC', 'regra', 'Política sem revisão em 12 meses vira pendência automática', '', 'pendente', 'a1ce2f36-7c19-4ec0-bad6-4e405701cb0a', '', '', '', 10), -- g11
  ('417c19b1-f1bd-403b-a024-b0579f50316e', 'GRC', 'sistema', 'Gestão de fornecedores', 'Avaliação de segurança de terceiros', 'atencao', null, 'Questionário em planilha', 'Interno', 'v1', 11), -- g12
  ('83646e8d-2844-4ed3-b6b4-e33de19d6613', 'GRC', 'config', 'Questionário de due diligence', 'Aplicado antes da contratação e renovado a cada ano', 'pendente', '417c19b1-f1bd-403b-a024-b0579f50316e', '', '', '', 12), -- g13
  ('fae4d5fd-7ba7-4a12-92da-7e867620ad82', 'GRC', 'regra', 'Fornecedor crítico precisa de cláusula de LGPD no contrato', '', 'atencao', '83646e8d-2844-4ed3-b6b4-e33de19d6613', '', '', '', 13), -- g14
  ('74d9cdc5-5033-4729-b6f6-c3f32854fada', 'IAM', 'sistema', 'Provedor de identidade com SSO', 'Login único para todos os sistemas', 'ok', null, 'Microsoft Entra ID', 'Microsoft', 'P1', 14), -- i1
  ('3b9d7f0a-c9ef-40e3-b4be-2b8e456adb07', 'IAM', 'config', 'MFA obrigatório', 'App autenticador ou chave FIDO2, sem SMS', 'ok', '74d9cdc5-5033-4729-b6f6-c3f32854fada', '', '', '', 15), -- i2
  ('2ac5855a-f252-4fa3-8af4-3d9920cb8795', 'IAM', 'regra', 'ERP e banco só acessam com MFA', '', 'ok', '3b9d7f0a-c9ef-40e3-b4be-2b8e456adb07', '', '', '', 16), -- i3
  ('c0bb0f56-4167-40c8-87fe-5f648912a2df', 'IAM', 'regra', 'Login fora do Brasil é bloqueado', '', 'atencao', '3b9d7f0a-c9ef-40e3-b4be-2b8e456adb07', '', '', '', 17), -- i4
  ('ba87c1cc-f04c-4ad7-afd1-eca31464f632', 'IAM', 'config', 'Acesso condicional', 'Dispositivo gerenciado exigido para dados financeiros', 'ok', '74d9cdc5-5033-4729-b6f6-c3f32854fada', '', '', '', 18), -- i5
  ('b1397365-403e-4289-a6b3-33ef5b3125b2', 'IAM', 'sistema', 'Cofre de acessos privilegiados', 'Senhas de administradores e contas de serviço', 'atencao', null, 'CyberArk', 'CyberArk', '14', 19), -- i6
  ('107092c6-00bc-44a6-874c-05de793a49fd', 'IAM', 'config', 'Rotação automática de senhas', 'Troca a cada 30 dias e após cada uso', 'atencao', 'b1397365-403e-4289-a6b3-33ef5b3125b2', '', '', '', 20), -- i7
  ('d8a3e06e-feb4-45f8-ab8a-720de304bbc5', 'IAM', 'regra', 'Administrador só acessa com sessão gravada', '', 'pendente', '107092c6-00bc-44a6-874c-05de793a49fd', '', '', '', 21), -- i8
  ('ffcd0f9c-e1b5-41e1-a4ae-5615c9d0d9d8', 'IAM', 'sistema', 'Ciclo de vida de contas', 'Criação e desligamento de acessos a partir do RH', 'ok', null, 'Entra ID Governance', 'Microsoft', 'SaaS', 22), -- i9
  ('6130f0c8-5c49-4320-9215-d9d97a526afe', 'IAM', 'config', 'Integração com o sistema de RH', 'Admissão e desligamento disparam criação e remoção', 'ok', 'ffcd0f9c-e1b5-41e1-a4ae-5615c9d0d9d8', '', '', '', 23), -- i10
  ('75437445-64f4-4e0b-8387-b313b9c274ac', 'IAM', 'regra', 'Conta de desligado é desativada em até 1 hora', '', 'atencao', '6130f0c8-5c49-4320-9215-d9d97a526afe', '', '', '', 24), -- i11
  ('84458ae1-183d-42a1-9c3b-23743601e1c9', 'IAM', 'regra', 'Conta sem uso por 90 dias é desativada', '', 'pendente', '6130f0c8-5c49-4320-9215-d9d97a526afe', '', '', '', 25), -- i12
  ('28641f58-b59b-4df1-a21f-6dd5a59ed588', 'IAM', 'config', 'Revisão semestral de acessos', 'Gestores recertificam o acesso de cada equipe', 'pendente', 'ffcd0f9c-e1b5-41e1-a4ae-5615c9d0d9d8', '', '', '', 26), -- i13
  ('433b574e-8d92-43fb-b5db-a795a85a9ef5', 'IAM', 'regra', 'Acesso conforme o perfil da função, sem acúmulo', '', 'ok', '28641f58-b59b-4df1-a21f-6dd5a59ed588', '', '', '', 27), -- i14
  ('4f40d54e-548c-428c-8559-9b05fc2c43b4', 'Network', 'sistema', 'Firewall de borda', 'Controle de entrada e saída da rede', 'ok', null, 'FortiGate', 'Fortinet', 'FortiOS 7.4', 28), -- n1
  ('a3ef1b9a-e69c-48ea-98b6-253860708afa', 'Network', 'config', 'Zona do financeiro', 'Rede isolada para ERP, folha e conciliação', 'ok', '4f40d54e-548c-428c-8559-9b05fc2c43b4', '', '', '', 29), -- n2
  ('5c7d1094-2e54-402f-a173-eee7af0e074f', 'Network', 'regra', 'Só HTTPS chega ao ERP', '', 'ok', 'a3ef1b9a-e69c-48ea-98b6-253860708afa', '', '', '', 30), -- n3
  ('46d56822-0edb-49e8-aeb2-3fdeab286d99', 'Network', 'regra', 'Zonas não se comunicam sem regra explícita', '', 'ok', 'a3ef1b9a-e69c-48ea-98b6-253860708afa', '', '', '', 31), -- n4
  ('70866a1a-2d7a-4315-9add-c7f1231d397b', 'Network', 'config', 'Inspeção de tráfego (IPS)', 'Assinaturas atualizadas diariamente', 'atencao', '4f40d54e-548c-428c-8559-9b05fc2c43b4', '', '', '', 32), -- n5
  ('dc523dfb-d8b5-4f88-9079-a501d42c05db', 'Network', 'sistema', 'VPN corporativa', 'Acesso remoto de colaboradores', 'ok', null, 'FortiClient VPN', 'Fortinet', '7.2', 33), -- n6
  ('00509632-1981-4871-ab21-d6b90023daab', 'Network', 'config', 'Túnel com autenticação forte', 'Certificado do dispositivo mais MFA', 'ok', 'dc523dfb-d8b5-4f88-9079-a501d42c05db', '', '', '', 34), -- n7
  ('57d0dc20-7fdc-4059-9c60-111447c9aff1', 'Network', 'regra', 'Sem VPN, sem acesso aos sistemas internos', '', 'ok', '00509632-1981-4871-ab21-d6b90023daab', '', '', '', 35), -- n8
  ('36eee776-2a12-4ff6-a465-f5622a69e125', 'Network', 'sistema', 'Switches e Wi-Fi', 'Rede local dos escritórios', 'atencao', null, 'Meraki', 'Cisco', 'MR 30', 36), -- n9
  ('12c724a0-45bb-4ee6-9bf2-5d0dd07ec841', 'Network', 'config', 'Wi-Fi de visitantes separado', 'Rede isolada, sem rota para a rede interna', 'ok', '36eee776-2a12-4ff6-a465-f5622a69e125', '', '', '', 37), -- n10
  ('16e64d07-93c0-472a-8036-f35fc8b0a989', 'Network', 'regra', 'Visitante nunca alcança a rede corporativa', '', 'ok', '12c724a0-45bb-4ee6-9bf2-5d0dd07ec841', '', '', '', 38), -- n11
  ('6998fbf9-492e-40be-b251-e5065969a2d0', 'Network', 'sistema', 'DNS e proxy web', 'Filtro de navegação e resolução de nomes', 'pendente', null, 'Umbrella', 'Cisco', 'SaaS', 39), -- n12
  ('f2aee552-83e0-43cb-90d3-3520c592c519', 'Network', 'config', 'Bloqueio de categorias de risco', 'Phishing, malware e apostas', 'pendente', '6998fbf9-492e-40be-b251-e5065969a2d0', '', '', '', 40), -- n13
  ('560d6e1f-1b52-4818-998f-b79ddcd8400e', 'Network', 'regra', 'Download de executáveis é bloqueado', '', 'pendente', 'f2aee552-83e0-43cb-90d3-3520c592c519', '', '', '', 41), -- n14
  ('c320b68e-ea91-4dd2-9e1b-773cd9b7ab99', 'Endpoint', 'sistema', 'Proteção das estações (EDR)', 'Detecta e contém ameaças nos computadores', 'ok', null, 'Falcon', 'CrowdStrike', 'Sensor 7', 42), -- e1
  ('2af67c40-1699-4026-9106-0d928ac2adbf', 'Endpoint', 'config', 'Modo de prevenção ativo', 'Bloqueia, e não só alerta', 'ok', 'c320b68e-ea91-4dd2-9e1b-773cd9b7ab99', '', '', '', 43), -- e2
  ('cc3e9e87-0e3f-4d3a-b9d4-ea676a41e865', 'Endpoint', 'regra', 'Máquina infectada é isolada automaticamente', '', 'atencao', '2af67c40-1699-4026-9106-0d928ac2adbf', '', '', '', 44), -- e3
  ('36efa82c-31d3-48a3-9a87-0857b4964d5f', 'Endpoint', 'sistema', 'Gestão de dispositivos (MDM)', 'Inventário e política dos notebooks', 'atencao', null, 'Intune', 'Microsoft', 'SaaS', 45), -- e4
  ('9bc80f94-ce9f-4c62-a84e-9ce073fb3093', 'Endpoint', 'config', 'Criptografia de disco', 'BitLocker em todos os notebooks', 'atencao', '36efa82c-31d3-48a3-9a87-0857b4964d5f', '', '', '', 46), -- e5
  ('f3cdc8e9-8c19-4bdc-864c-bcd8dde35a29', 'Endpoint', 'regra', 'Notebook sem criptografia não acessa dados financeiros', '', 'pendente', '9bc80f94-ce9f-4c62-a84e-9ce073fb3093', '', '', '', 47), -- e6
  ('3082ed16-cab9-4e21-a500-dd0e8a047350', 'Endpoint', 'config', 'Bloqueio de tela', 'Após 5 minutos de inatividade', 'ok', '36efa82c-31d3-48a3-9a87-0857b4964d5f', '', '', '', 48), -- e7
  ('e1a3a6ea-dac1-4cb1-b293-ba07cd693394', 'Endpoint', 'sistema', 'Gestão de correções', 'Atualização de sistema e aplicativos', 'atencao', null, 'WSUS e Intune', 'Microsoft', 'Windows Server', 49), -- e8
  ('29313c02-b596-45d8-ae89-c5f4e8a94f57', 'Endpoint', 'config', 'Janela de atualização semanal', 'Correções críticas em até 7 dias', 'atencao', 'e1a3a6ea-dac1-4cb1-b293-ba07cd693394', '', '', '', 50), -- e9
  ('f780791d-16c9-4b47-8519-047ef0d9861c', 'Endpoint', 'regra', 'Vulnerabilidade crítica é corrigida em 7 dias', '', 'pendente', '29313c02-b596-45d8-ae89-c5f4e8a94f57', '', '', '', 51), -- e10
  ('1a89fe68-e492-481d-9d3f-28407bb5ca31', 'Endpoint', 'sistema', 'Segurança de e-mail', 'Filtro contra phishing e anexos maliciosos', 'ok', null, 'Defender for Office 365', 'Microsoft', 'Plano 2', 52), -- e11
  ('e3fa677f-7164-4e74-83a8-059d0ed77e93', 'Endpoint', 'config', 'Análise de anexos em ambiente isolado', 'Anexos desconhecidos abrem em área separada', 'ok', '1a89fe68-e492-481d-9d3f-28407bb5ca31', '', '', '', 53), -- e12
  ('3576e549-a31d-49f4-b5a5-db3f8b254c3e', 'Endpoint', 'regra', 'Anexo com macro é bloqueado', '', 'ok', 'e3fa677f-7164-4e74-83a8-059d0ed77e93', '', '', '', 54), -- e13
  ('43330857-0996-4170-803f-b3de43512e9d', 'Endpoint', 'config', 'Proteção contra falsificação de domínio', 'SPF, DKIM e DMARC configurados', 'atencao', '1a89fe68-e492-481d-9d3f-28407bb5ca31', '', '', '', 55), -- e14
  ('6c0df340-bbaf-462f-bcee-dfa675b81e34', 'Endpoint', 'regra', 'E-mail que falha no DMARC é rejeitado', '', 'atencao', '43330857-0996-4170-803f-b3de43512e9d', '', '', '', 56), -- e15
  ('60b4afdf-f753-4b65-97d8-9fc3f3daeabe', 'SOC', 'sistema', 'SIEM', 'Reúne e correlaciona os logs do ambiente', 'atencao', null, 'Enterprise Security', 'Splunk', '9', 57), -- s1
  ('44c54c4f-63d5-44e0-b609-d31853264afc', 'SOC', 'config', 'Fontes de log conectadas', 'Firewall, EDR, identidade e e-mail', 'atencao', '60b4afdf-f753-4b65-97d8-9fc3f3daeabe', '', '', '', 58), -- s2
  ('f267bf50-e9dd-4748-b4c5-d6c158c76c2c', 'SOC', 'regra', 'Logs ficam retidos por 12 meses', '', 'ok', '44c54c4f-63d5-44e0-b609-d31853264afc', '', '', '', 59), -- s3
  ('e19fcb95-57dd-4a30-b7d2-03783fa5a55c', 'SOC', 'config', 'Regras de detecção', 'Login anômalo, movimento lateral e exfiltração', 'atencao', '60b4afdf-f753-4b65-97d8-9fc3f3daeabe', '', '', '', 60), -- s4
  ('6ec0cffd-4023-4273-b55a-85851511f318', 'SOC', 'regra', 'Login impossível (dois países em 1 hora) gera alerta alto', '', 'pendente', 'e19fcb95-57dd-4a30-b7d2-03783fa5a55c', '', '', '', 61), -- s5
  ('af60c79d-75c0-437a-b04b-45528e15172b', 'SOC', 'sistema', 'Plataforma de resposta (SOAR)', 'Automatiza a resposta aos alertas', 'pendente', null, 'Splunk SOAR', 'Splunk', '6', 62), -- s6
  ('ca5e12e8-a6f4-401b-8643-1ac04117a8cc', 'SOC', 'config', 'Playbook de phishing', 'Isola o e-mail, reinicia a senha e abre chamado', 'pendente', 'af60c79d-75c0-437a-b04b-45528e15172b', '', '', '', 63), -- s7
  ('0b2e688d-5d8f-4456-bcdf-98ef5a75af5a', 'SOC', 'regra', 'Alerta crítico é tratado em até 15 minutos', '', 'pendente', 'ca5e12e8-a6f4-401b-8643-1ac04117a8cc', '', '', '', 64), -- s8
  ('b5fe5860-5102-49a7-a268-b65d23ea5b7b', 'SOC', 'sistema', 'Gestão de incidentes', 'Registro e acompanhamento dos incidentes', 'ok', null, 'Jira Service Management', 'Atlassian', 'Cloud', 65), -- s9
  ('23ad29a4-547e-45e6-aea9-de6591b6e497', 'SOC', 'config', 'Classificação de severidade', 'Quatro níveis, com prazo de resposta por nível', 'ok', 'b5fe5860-5102-49a7-a268-b65d23ea5b7b', '', '', '', 66), -- s10
  ('61746014-81e5-4795-b08b-b0112422902e', 'SOC', 'regra', 'Incidente grave aciona o comitê em até 1 hora', '', 'atencao', '23ad29a4-547e-45e6-aea9-de6591b6e497', '', '', '', 67), -- s11
  ('c234eb60-d7fa-4200-9a72-c35df4e44b5f', 'SOC', 'sistema', 'Varredura de vulnerabilidades', 'Descoberta de falhas em servidores e estações', 'ok', null, 'Nessus', 'Tenable', '10', 68), -- s12
  ('8b2b009d-54ad-457b-8108-ff26aba926aa', 'SOC', 'config', 'Varredura semanal autenticada', 'Todos os servidores e uma amostra das estações', 'ok', 'c234eb60-d7fa-4200-9a72-c35df4e44b5f', '', '', '', 69), -- s13
  ('d0dbd3fb-432f-4bb5-8cc8-840fac0832bd', 'SOC', 'regra', 'Falha crítica sem correção vira incidente', '', 'atencao', '8b2b009d-54ad-457b-8108-ff26aba926aa', '', '', '', 70) -- s14
on conflict (id) do nothing;
