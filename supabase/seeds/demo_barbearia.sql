-- ============================================================================
-- demo_barbearia.sql
-- SEED DE DEMONSTRAÇÃO — não é uma migration (por isso não tem número 00X e
-- não mexe em tabela/função/policy nenhuma, só insere linhas). NÃO RODE
-- AUTOMATICAMENTE: isto é pra você revisar e colar no SQL Editor do Supabase
-- manualmente, quando quiser (re)criar os dados de demonstração. Pode ser
-- rodado em qualquer banco onde as migrations 001 a 005 já tenham sido
-- aplicadas (é exatamente o caso do banco de produção atual).
--
-- O QUE ESTE ARQUIVO CRIA:
--   - 1 barbearia ("Barbearia Imperial", slug "demo" -> página pública em
--     /b/demo), no Rio de Janeiro (endereço fictício), com o TELEFONE DE
--     VERDADE do dono (pro botão "Falar com a barbearia" chegar em você);
--   - 3 barbeiros;
--   - 8 serviços, com preço de mercado (corte, barba, combo, sobrancelha,
--     infantil, pigmentação, luzes e hidratação);
--   - horário de trabalho de terça a sábado, 9h às 19h, pros 3 barbeiros;
--   - 200 clientes fictícios, nomes masculinos (é barbearia), gerados
--     combinando 2 listas de nome+sobrenome, sem repetir nome completo,
--     com telefone fictício no DDD do Rio (21), pra combinar com o endereço;
--   - agendamentos do ÚLTIMOS 30 DIAS, de HOJE (parte já passou, parte
--     ainda não) e dos PRÓXIMOS 5 DIAS — com mais movimento sexta/sábado,
--     e "Corte Infantil" só pros 5 clientes marcados como pais — pra
--     agenda, faturamento e a agenda do DIA DE HOJE aparecerem preenchidos
--     numa demonstração ao vivo, SEM nenhum buraco (ver "SOBRE O ALGORITMO"
--     abaixo — correção de um bug da versão anterior deste seed).
--
-- SOBRE O ALGORITMO (corrige o bug da versão anterior): a versão antiga
-- gerava os agendamentos em ORDEM CRONOLÓGICA (primeiro os próximos dias,
-- depois hoje, só por último os 30 dias passados, do mais antigo pro mais
-- recente) e ia consumindo a "cota" de visitas de cada cliente nessa mesma
-- ordem. Com poucos clientes (120) e cota baixa (a maioria só 1 a 3
-- visitas), a cota de TODOS os clientes se esgotava bem antes do laço do
-- histórico chegar nos dias mais recentes — resultado: um "buraco" real
-- sem nenhum agendamento nos ~2 últimos terços do período passado. A
-- correção, pedida e aplicada aqui, separa a geração em 2 fases:
--   FASE A: percorre TODO o período (30 dias passados + hoje + 5 dias
--     futuros) e decide só QUAIS horários ficam ocupados (dia, barbeiro,
--     início/fim, serviço) — sem escolher cliente nenhum ainda. Guardado
--     numa tabela temporária, "tmp_slots_demo".
--   FASE B: embaralha esses horários (order by random()) e só ENTÃO sorteia
--     um cliente (com cota sobrando) pra cada um, na ordem embaralhada.
-- Como a ordem em que os horários "competem" por clientes agora é
-- aleatória (não mais cronológica), o esgotamento da cota se espalha de
-- forma pareja por TODO o período — nenhum trecho de dias fica
-- sistematicamente sem ninguém disponível.
--
-- O QUE ESTE ARQUIVO **NÃO** CRIA DE PROPÓSITO, a menos que a conta já
-- exista: nenhuma linha em "membros" pra qualquer OUTRO email além do seu.
-- Lá no final deste arquivo (depois do "do $$ ... end $$;" principal) já
-- tem um bloco pronto e DESCOMENTADO que busca sua conta em auth.users pelo
-- email sobreira.fabricio@hotmail.com e te liga como "dono" desta
-- barbearia automaticamente — se essa conta ainda não existir quando você
-- rodar o seed, esse bloco só avisa (raise notice) e não quebra nada; basta
-- criar a conta pelo /cadastro depois e rodar ESSE BLOCO FINAL de novo
-- (não precisa repetir o seed inteiro). Veja o passo a passo completo no
-- RELATORIO.md, seção "Como ligar a barbearia de demonstração à sua conta".
--
-- SOBRE OS DADOS SEREM ALEATÓRIOS: a geração dos agendamentos (e dos 200
-- nomes de clientes) usa random(), então o resultado muda um pouco a cada
-- vez que você roda este arquivo — de propósito, pra não parecer uma
-- demonstração "robotizada", sempre idêntica. A distribuição por dia da
-- semana, o limite de visitas por cliente e o volume geral, porém,
-- continuam dentro das mesmas regras em qualquer execução.
--
-- SOBRE RODAR DUAS VEZES: o script para com um erro amigável se já existir
-- uma barbearia com slug "demo" (pra não criar duplicata por engano). Se
-- quiser recomeçar do zero (ex: no dia de uma apresentação, pra ter
-- agendamentos de "hoje" atualizados), apague a barbearia antes — o "on
-- delete cascade" das migrations já leva barbeiros/serviços/horários/
-- clientes/agendamentos/membros junto, numa linha só:
--   delete from barbearias where slug = 'demo';
-- (isso TAMBÉM apaga o vínculo em "membros" — sem problema, o bloco final
-- deste arquivo já religa sua conta de novo, sozinho, quando você rodar o
-- seed inteiro outra vez)
-- ============================================================================

do $$
declare
  -- ids que vamos precisar reaproveitar em vários passos seguintes
  v_barbearia_id uuid;
  v_barbeiro_1 uuid;
  v_barbeiro_2 uuid;
  v_barbeiro_3 uuid;
  v_servico_corte uuid;
  v_servico_barba uuid;
  v_servico_combo uuid;
  v_servico_sobrancelha uuid;
  v_servico_infantil uuid;
  v_servico_pigmentacao uuid;
  v_servico_luzes uuid;
  v_servico_hidratacao uuid;

  -- nomes masculinos (é barbearia): 2 listas combinadas na hora de gerar os
  -- 200 clientes (passo 5) — "nome || ' ' || sobrenome", sem repetir a
  -- combinação completa (ver como isso é garantido no passo 5)
  v_primeiros_nomes text[] := array[
    'João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Gustavo', 'Felipe',
    'Bruno', 'Rodrigo', 'Thiago', 'Eduardo', 'Leonardo', 'André', 'Diego', 'Vinícius',
    'Marcelo', 'Fernando', 'Ricardo', 'Daniel', 'Carlos', 'Paulo', 'Henrique', 'Caio',
    'Igor', 'Marcos', 'Fábio', 'Renato', 'Alexandre', 'Guilherme'
  ];
  v_sobrenomes text[] := array[
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira',
    'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Dias',
    'Monteiro', 'Cardoso', 'Teixeira', 'Moreira', 'Araújo', 'Castro', 'Correia', 'Fonseca',
    'Barbosa', 'Nunes', 'Mendes', 'Alves'
  ];

  -- "pools" (conjuntos) usados pra sortear aleatoriamente quem atende e o
  -- que é feito, na hora de gerar os horários (passo 6, fase A). O "pool" de
  -- CLIENTES virou uma tabela temporária (tmp_clientes_demo, criada no
  -- passo 5), não um array — porque cada cliente tem uma "cota" de visitas
  -- que precisa ser controlada enquanto os agendamentos são distribuídos
  -- (fase B), e isso é bem mais natural numa tabela do que num array solto.
  v_pool_barbeiros uuid[];
  v_pool_servicos uuid[]; -- com REPETIÇÃO: um serviço mais popular aparece mais vezes aqui, pra ter mais chance de ser sorteado (ver passo 3)
  v_pool_observacoes text[] := array[ -- uma observação ocasional, só pra dar vida real ao histórico (ver passo 6, fase B)
    'Cliente pediu máquina 1 nas laterais',
    'Pediu pra não mexer no topo',
    'Primeira vez na barbearia',
    'Cliente fiel, sempre no mesmo horário',
    'Trouxe foto de referência pelo WhatsApp',
    'Pediu produto pós-barba sem álcool'
  ];
  v_qtd_fieis int; -- quantos clientes (entre 10 e 15) vão virar "fiéis" (cota de 4 a 6 visitas) — ver passo 5

  -- variáveis do passo 6 (fase A: gerar os horários ocupados do período inteiro)
  v_hoje date;
  v_inicio_periodo date;
  v_fim_periodo date;
  v_dia date;
  v_dia_semana int;
  v_probabilidade numeric; -- chance (0 a 1) de preencher CADA horário de 30min testado, varia por dia da semana e por ser passado/futuro
  v_barbeiro_id uuid;
  v_cursor timestamptz;         -- "ponteiro" andando pelo expediente do dia, barbeiro por barbeiro
  v_fim_expediente timestamptz;
  v_servico_id uuid;
  v_duracao_min int;
  v_preco_centavos int;
  v_fim_atendimento timestamptz;

  -- variáveis do passo 6 (fase B: embaralhar os horários gerados e distribuir os clientes)
  v_slot record; -- cada linha de tmp_slots_demo, lida em ordem ALEATÓRIA (ver "for v_slot in select ... order by random()")
  v_cliente_id uuid;
  v_status status_agendamento;
  v_observacao text;
  v_sorteio numeric; -- número aleatório reaproveitado pra decidir o status de cada agendamento

  v_total_agendamentos int; -- só pro aviso final (raise notice), de conferência
  v_total_clientes_usados int;
begin

  -- rede de segurança: evita criar uma 2ª barbearia "demo" por engano, se
  -- este arquivo for colado e rodado de novo sem querer (o "unique" em
  -- barbearias.slug já impediria de qualquer forma, mas com um erro menos
  -- claro do que este)
  if exists (select 1 from barbearias where slug = 'demo') then
    raise exception 'Já existe uma barbearia com slug ''demo''. Apague-a antes (delete from barbearias where slug = ''demo'';) pra rodar este seed de novo.';
  end if;

  -- --------------------------------------------------------------------------
  -- 1) A BARBEARIA
  -- --------------------------------------------------------------------------
  -- nome escolhido entre as 3 opções sugeridas no RELATORIO.md — troque aqui
  -- antes de rodar, se preferir outra. Telefone no MESMO formato que o resto
  -- do site usa (só dígitos, com DDD, sem "+55" — ver utils/telefone.ts): é
  -- o que "Falar com a barbearia" (página pública) e o WhatsApp do painel
  -- esperam pra montar o link certo.
  insert into barbearias (nome, slug, telefone, endereco)
  values (
    'Barbearia Imperial',                               -- nome de exibição, no painel e na página pública
    'demo',                                              -- slug fixo, como pedido: a página pública fica em /b/demo
    '21990163583',                                       -- telefone de verdade do dono: é pra ele que o botão "Falar com a barbearia" da demo liga
    'Rua das Laranjeiras, 300 - Laranjeiras, Rio de Janeiro - RJ' -- endereço fictício no Rio, pra combinar com o DDD 21 dos clientes (ver passo 5)
  )
  returning id into v_barbearia_id; -- guarda o id gerado: todo o resto do script depende dele

  -- --------------------------------------------------------------------------
  -- 2) OS 3 BARBEIROS
  -- --------------------------------------------------------------------------
  -- inserts separados (em vez de um só com 3 linhas) justamente pra poder
  -- guardar cada id numa variável com nome, e montar o "pool" logo abaixo
  insert into barbeiros (barbearia_id, nome, ativo) values (v_barbearia_id, 'Carlos Mendes', true) returning id into v_barbeiro_1;
  insert into barbeiros (barbearia_id, nome, ativo) values (v_barbearia_id, 'Rafael Alves', true) returning id into v_barbeiro_2;
  insert into barbeiros (barbearia_id, nome, ativo) values (v_barbearia_id, 'Bruno Costa', true) returning id into v_barbeiro_3;

  v_pool_barbeiros := array[v_barbeiro_1, v_barbeiro_2, v_barbeiro_3]; -- usado no passo 6 (fase A), pra sortear quem atende

  -- --------------------------------------------------------------------------
  -- 3) OS 8 SERVIÇOS (preço de mercado, em centavos — ver utils/dinheiro.ts)
  -- --------------------------------------------------------------------------
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Corte Masculino', 30, 4500, true) returning id into v_servico_corte; -- R$ 45,00 — o serviço mais pedido de qualquer barbearia
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Barba', 30, 3500, true) returning id into v_servico_barba; -- R$ 35,00
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Corte + Barba (Combo)', 60, 7000, true) returning id into v_servico_combo; -- R$ 70,00 — mais barato que corte+barba separados (45+35=80), incentivo real de combo
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Sobrancelha na Navalha', 15, 2000, true) returning id into v_servico_sobrancelha; -- R$ 20,00 — serviço rápido, preço baixo
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Corte Infantil (até 12 anos)', 30, 3500, true) returning id into v_servico_infantil; -- R$ 35,00 — só sorteado pros clientes marcados como "pai" (ver passo 5 e 6)
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Pigmentação de Barba', 30, 5000, true) returning id into v_servico_pigmentacao; -- R$ 50,00 — serviço "premium", menos frequente
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Luzes / Platinado', 90, 15000, true) returning id into v_servico_luzes; -- R$ 150,00 — o mais caro e demorado, raro no dia a dia
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Hidratação Capilar', 30, 4000, true) returning id into v_servico_hidratacao; -- R$ 40,00

  -- "pool" COM REPETIÇÃO, pra sortear um serviço mais tarde com popularidade
  -- realista: corte/barba/combo aparecem muito mais vezes aqui do que
  -- pigmentação/luzes, por exemplo, então têm muito mais chance de "sair no
  -- sorteio" de cada horário (array_fill repete o id N vezes). O Corte
  -- Infantil continua aqui com peso baixo — o que realmente limita ele a
  -- "só alguns clientes" é a regra do passo 6 (fase B), não o peso sozinho.
  v_pool_servicos :=
    array_fill(v_servico_corte, array[32]) ||
    array_fill(v_servico_barba, array[20]) ||
    array_fill(v_servico_combo, array[24]) ||
    array_fill(v_servico_sobrancelha, array[8]) ||
    array_fill(v_servico_infantil, array[6]) ||
    array_fill(v_servico_pigmentacao, array[4]) ||
    array_fill(v_servico_luzes, array[2]) ||
    array_fill(v_servico_hidratacao, array[6]);

  -- --------------------------------------------------------------------------
  -- 4) HORÁRIO DE TRABALHO: terça (2) a sábado (6), 9h às 19h, pros 3
  -- --------------------------------------------------------------------------
  -- "unnest" nos dois arrays monta o produto cartesiano (3 barbeiros x 5
  -- dias = 15 linhas) numa única instrução, em vez de 15 inserts repetidos.
  -- Domingo (0) e segunda (1) ficam de fora de propósito: barbearia fechada.
  insert into horarios_trabalho (barbearia_id, barbeiro_id, dia_semana, inicio, fim)
  select v_barbearia_id, b.barbeiro_id, d.dia_semana, time '09:00', time '19:00'
  from unnest(v_pool_barbeiros) as b(barbeiro_id)
  cross join unnest(array[2, 3, 4, 5, 6]) as d(dia_semana);

  -- --------------------------------------------------------------------------
  -- 5) 200 CLIENTES FICTÍCIOS (nomes masculinos, cota de visitas, e quem é
  --    "pai" pro Corte Infantil)
  -- --------------------------------------------------------------------------
  -- tabela temporária (só existe durante esta sessão): guarda, pra cada
  -- cliente, quantas vezes ele DEVE aparecer no total (quota) e quantas já
  -- apareceu até agora (usados) — é isso que o passo 6 (fase B) consulta
  -- toda vez que precisa sortear um cliente, respeitando o limite de cada um
  create temporary table tmp_clientes_demo (
    id uuid,                        -- preenchido mais abaixo, depois do insert em "clientes" de verdade
    nome text,
    telefone text,
    quota int,                      -- quantas visitas esse cliente deve ter, no total (passado + hoje + futuro)
    usados int not null default 0,  -- quantas vezes já foi sorteado até agora (nunca passa de "quota")
    tem_filho boolean not null default false -- true só pros ~5 clientes que podem levar um filho pro Corte Infantil
  );

  -- 200 nomes DISTINTOS: todas as combinações possíveis de primeiro nome x
  -- sobrenome (30 x 28 = 840 combinações) embaralhadas, pegando só as 200
  -- primeiras — como vem de um PRODUTO CARTESIANO sem repetir linha, é
  -- impossível sair "João Silva" duas vezes
  insert into tmp_clientes_demo (nome, quota)
  select pn.nome || ' ' || sn.nome, 0 -- "0" é só um valor provisório; a quota de verdade é definida nas 2 atualizações logo abaixo
  from unnest(v_primeiros_nomes) as pn(nome)
  cross join unnest(v_sobrenomes) as sn(nome)
  order by random()
  limit 200;

  -- quota-base: a MAIORIA dos clientes (os 200, antes do próximo update)
  -- recebe entre 1 e 3 visitas no período — "a maioria com 1 a 3 visitas", como pedido
  update tmp_clientes_demo set quota = 1 + floor(random() * 3)::int; -- 1, 2 ou 3

  -- clientes "fiéis": entre 10 e 15 deles (sorteado agora, uma vez) têm a
  -- quota SOBRESCRITA pra 4 a 6 visitas — nunca mais que 6, como pedido
  v_qtd_fieis := 10 + floor(random() * 6)::int; -- 10 a 15
  update tmp_clientes_demo
  set quota = 4 + floor(random() * 3)::int -- 4, 5 ou 6
  where nome in (select nome from tmp_clientes_demo order by random() limit v_qtd_fieis);

  -- "pais": exatamente 5 clientes (podem ou não ser também "fiéis" — são
  -- coisas independentes) marcados como quem pode levar um filho pro Corte
  -- Infantil. Só eles entram no sorteio quando esse serviço "sai" (passo 6).
  update tmp_clientes_demo
  set tem_filho = true
  where nome in (select nome from tmp_clientes_demo order by random() limit 5);

  -- telefone sequencial: '2190000' + 4 dígitos (0001, 0002...), com o DDD do
  -- Rio (21) pra combinar com o endereço da barbearia, nunca um número de
  -- verdade por acidente, e sempre com 11 dígitos (bate com a constraint
  -- "clientes_telefone_formato", que exige 10 ou 11 só-números — ver
  -- migration 003). "row_number() over (order by nome)" dá um número de 1 a
  -- 200 pra cada linha, sem repetir, e "lpad(...,4,'0')" completa com zeros
  -- à esquerda (1 -> "0001", 200 -> "0200")
  with numerados as (
    select nome, row_number() over (order by nome) as posicao
    from tmp_clientes_demo
  )
  update tmp_clientes_demo t
  set telefone = '2190000' || lpad(numerados.posicao::text, 4, '0')
  from numerados
  where t.nome = numerados.nome;

  -- grava os 200 clientes de verdade na tabela "clientes"...
  insert into clientes (barbearia_id, nome, telefone)
  select v_barbearia_id, nome, telefone from tmp_clientes_demo;

  -- ...e traz o "id" de volta pra tabela temporária (nome+telefone juntos
  -- identificam a linha certa sem ambiguidade, já que os dois são únicos)
  update tmp_clientes_demo t
  set id = c.id
  from clientes c
  where c.barbearia_id = v_barbearia_id and c.nome = t.nome and c.telefone = t.telefone;

  -- --------------------------------------------------------------------------
  -- 6) AGENDAMENTOS — ÚLTIMOS 30 DIAS + HOJE + PRÓXIMOS 5 DIAS, SEM BURACOS
  -- --------------------------------------------------------------------------
  v_hoje := (now() at time zone 'America/Sao_Paulo')::date; -- "hoje" no fuso do Brasil, mesmo critério usado em todo o resto do site
  v_inicio_periodo := v_hoje - interval '30 days';
  v_fim_periodo := v_hoje + interval '5 days';

  -- tabela temporária que guarda os horários decididos na FASE A, ainda SEM
  -- cliente nenhum atribuído — "eh_passado" já fica calculado aqui (horário
  -- de início antes de "agora") porque é o que decide, na fase B, se esse
  -- agendamento recebe um status de passado (concluído/cancelado/faltou) ou
  -- de futuro (agendado/confirmado)
  create temporary table tmp_slots_demo (
    id bigserial primary key,
    barbeiro_id uuid not null,
    inicio timestamptz not null,
    fim timestamptz not null,
    servico_id uuid not null,
    preco_centavos int not null,
    eh_passado boolean not null
  );

  -- FASE A: percorre TODO o período (30 dias passados até 5 dias futuros,
  -- só terça a sábado) e decide quais horários ficam ocupados, pra CADA
  -- barbeiro — sem escolher cliente nenhum ainda. O "cursor" andando de
  -- 30 em 30 minutos dentro de cada dia/barbeiro garante, por construção,
  -- que o mesmo barbeiro nunca fica com 2 horários que se cruzam.
  for v_dia in select generate_series(v_inicio_periodo, v_fim_periodo, interval '1 day')::date loop
    v_dia_semana := extract(dow from v_dia)::int;
    if v_dia_semana not in (2, 3, 4, 5, 6) then
      continue; -- domingo/segunda: barbearia fechada, nenhum horário possível nesse dia
    end if;

    if v_dia > v_hoje then
      -- dias estritamente futuros: agenda ainda "enchendo" (clientes ainda vão ligar/agendar),
      -- por isso a probabilidade é menor que num dia já vivido — mais movimento sexta/sábado
      v_probabilidade := case v_dia_semana
        when 5 then 0.30
        when 6 then 0.35
        else 0.15
      end;
    else
      -- hoje (misturado: parte passada e parte futura do MESMO dia, decidido depois,
      -- slot por slot, via "eh_passado") e os dias já vividos: tratados como "dia cheio",
      -- mesma curva de movimento, maior sexta/sábado
      v_probabilidade := case v_dia_semana
        when 2 then 0.35  -- terça
        when 3 then 0.35  -- quarta
        when 4 then 0.40  -- quinta
        when 5 then 0.60  -- sexta
        when 6 then 0.70  -- sábado
      end;
    end if;

    foreach v_barbeiro_id in array v_pool_barbeiros loop
      v_cursor := (v_dia + time '09:00') at time zone 'America/Sao_Paulo';
      v_fim_expediente := (v_dia + time '19:00') at time zone 'America/Sao_Paulo';

      while v_cursor < v_fim_expediente loop
        if random() < v_probabilidade then
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int]; -- array 1-indexado no Postgres, por isso o "+1"
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then -- só reserva o horário se o serviço COUBER até o fim do expediente
            insert into tmp_slots_demo (barbeiro_id, inicio, fim, servico_id, preco_centavos, eh_passado)
            values (v_barbeiro_id, v_cursor, v_fim_atendimento, v_servico_id, v_preco_centavos, v_cursor < now());

            v_cursor := v_fim_atendimento; -- pula o cursor pro fim deste horário (evita sobreposição com o próximo)
            continue; -- já avançou o cursor acima; não soma mais 30min embaixo
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes'; -- esse horário não foi reservado: avança o grid padrão
      end loop;
    end loop;
  end loop;

  -- FASE B: embaralha TODOS os horários reservados na fase A (de QUALQUER
  -- dia do período, misturados entre si) e só então sorteia um cliente com
  -- cota sobrando pra cada um, nessa ordem aleatória — é essa mistura entre
  -- dias diferentes (em vez de ir dia por dia, do mais antigo pro mais
  -- recente) que corrige o "buraco" da versão anterior deste seed: o
  -- esgotamento da cota dos clientes passa a se espalhar de forma pareja
  -- por todo o período, em vez de se concentrar só numa faixa de dias.
  for v_slot in select * from tmp_slots_demo order by random() loop
    -- sorteia 1 cliente QUE AINDA TENHA COTA; se o serviço sorteado foi o infantil, só entre os "pais"
    if v_slot.servico_id = v_servico_infantil then
      select id into v_cliente_id from tmp_clientes_demo where usados < quota and tem_filho = true order by random() limit 1;
    else
      select id into v_cliente_id from tmp_clientes_demo where usados < quota order by random() limit 1;
    end if;

    if v_cliente_id is null then
      continue; -- ninguém elegível com cota sobrando (e, se infantil, que seja "pai"): esse horário simplesmente fica livre, como na vida real
    end if;

    update tmp_clientes_demo set usados = usados + 1 where id = v_cliente_id;

    if v_slot.eh_passado then
      -- status realista pra um horário que já passou: a maioria concluído,
      -- uma fatia pequena cancelada, e uma fatia menor ainda de "faltou"
      v_sorteio := random();
      v_status := case
        when v_sorteio < 0.85 then 'concluido'::status_agendamento
        when v_sorteio < 0.94 then 'cancelado'::status_agendamento
        else 'faltou'::status_agendamento
      end;
      -- 12% de chance de ter uma observação (a maioria dos agendamentos reais não tem nenhuma)
      v_observacao := case when random() < 0.12
        then v_pool_observacoes[1 + floor(random() * array_length(v_pool_observacoes, 1))::int]
        else null
      end;
    else
      -- horário que ainda não chegou: status de futuro, sem observação
      v_status := case when random() < 0.5 then 'agendado'::status_agendamento else 'confirmado'::status_agendamento end;
      v_observacao := null;
    end if;

    insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos, status, observacao)
    values (v_barbearia_id, v_slot.barbeiro_id, v_cliente_id, v_slot.servico_id, v_slot.inicio, v_slot.fim, v_slot.preco_centavos, v_status, v_observacao);
  end loop;

  drop table tmp_slots_demo;    -- limpeza: já cumpriu o papel (os agendamentos de verdade já foram criados)
  drop table tmp_clientes_demo; -- limpeza: a tabela temporária não precisa mais existir (os ids finais já estão em "clientes")

  -- --------------------------------------------------------------------------
  -- aviso final, só informativo (aparece na aba "Resultados"/mensagens do
  -- SQL Editor) — ajuda a conferir rapidamente que o seed rodou por inteiro
  -- --------------------------------------------------------------------------
  select count(*) into v_total_agendamentos from agendamentos where barbearia_id = v_barbearia_id;
  select count(distinct cliente_id) into v_total_clientes_usados from agendamentos where barbearia_id = v_barbearia_id;
  raise notice 'Seed concluído: barbearia % (id %), % agendamentos, % dos 200 clientes com pelo menos 1 visita. Confira a distribuição por dia com o select comentado no final deste arquivo.',
    'demo', v_barbearia_id, v_total_agendamentos, v_total_clientes_usados;

end $$;

-- ============================================================================
-- CONFERÊNCIA (comentada) — contagem de agendamentos por dia, pra validar
-- visualmente que não há mais nenhum "buraco" nos últimos 30 dias. Descomente
-- e rode como um comando separado, depois do seed acima:
-- ============================================================================
-- select
--   (inicio at time zone 'America/Sao_Paulo')::date as dia,
--   count(*) as total_agendamentos
-- from agendamentos
-- where barbearia_id = (select id from barbearias where slug = 'demo')
-- group by 1
-- order by 1;

-- ============================================================================
-- LIGA O DONO DE VERDADE A ESTA BARBEARIA — já pronto e DESCOMENTADO: busca
-- sua conta em auth.users pelo email abaixo e te insere em "membros" como
-- 'dono' desta barbearia. Roda automaticamente toda vez que você executar
-- este arquivo inteiro de novo (ex: antes de cada apresentação), sem
-- precisar copiar/colar nenhum id na mão. Se a conta ainda não existir
-- nesse momento (ex: 1ª vez, antes de você ter criado o login pelo site),
-- só avisa com um "raise notice" e não quebra nada — crie a conta em
-- /cadastro e rode SÓ ESTE BLOCO de novo (não precisa repetir o seed
-- inteiro). Pra usar outro email, troque o texto abaixo.
-- ============================================================================
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'sobreira.fabricio@hotmail.com';

  if v_user_id is null then
    raise notice 'Conta com email sobreira.fabricio@hotmail.com ainda não existe em auth.users. Crie a conta pelo /cadastro e rode SÓ ESTE BLOCO final de novo.';
  else
    insert into membros (barbearia_id, user_id, papel)
    values ((select id from barbearias where slug = 'demo'), v_user_id, 'dono')
    on conflict do nothing; -- evita erro se, por algum motivo, esse vínculo já existir
  end if;
end $$;
