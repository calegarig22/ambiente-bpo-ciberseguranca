-- 003: novo perfil "visualizador" e Admin em qualquer área
--
-- visualizador: vê e edita todas as áreas, mas não acessa a aba Admin.
-- Antes, o Admin precisava ser de GRC; agora qualquer usuário pode virar Admin,
-- e a área passa a ser só "de onde a pessoa é" para Admin e visualizador.

alter type papel_usuario add value if not exists 'visualizador';

alter table usuarios drop constraint if exists usuarios_check;
