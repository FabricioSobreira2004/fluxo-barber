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
--     /b/demo), com endereço fictício e o TELEFONE DE VERDADE que você
--     colar no lugar de 'SEU_NUMERO' (ver passo obrigatório logo abaixo);
--   - 3 barbeiros;
--   - 8 serviços, com preço de mercado (corte, barba, combo, sobrancelha,
--     infantil, pigmentação, luzes e hidratação);
--   - horário de trabalho de terça a sábado, 9h às 19h, pros 3 barbeiros;
--   - 120 clientes fictícios, nomes masculinos (é barbearia), gerados
--     combinando 2 listas de nome+sobrenome, sem repetir nome completo;
--   - agendamentos do ÚLTIMOS 30 DIAS, de HOJE (parte já passou, parte
--     ainda não) e dos PRÓXIMOS 5 DIAS — com mais movimento sexta/sábado,
--     e "Corte Infantil" só pros 5 clientes marcados como pais — pra
--     agenda, faturamento e a agenda do DIA DE HOJE aparecerem preenchidos
--     numa demonstração ao vivo.
--
-- ⚠️ PASSO OBRIGATÓRIO ANTES DE RODAR: troque 'SEU_NUMERO' (procure no
-- "passo 1" logo abaixo) pelo SEU número de WhatsApp de verdade, só
-- dígitos, com DDD, sem "+55" (ex: '11999998888') — é esse número que o
-- botão "Falar com a barbearia" da página pública vai chamar quando a
-- demonstração "ainda não estiver pronta" (ou só pra conferir o botão).
--
-- O QUE ESTE ARQUIVO **NÃO** CRIA, DE PROPÓSITO: nenhuma linha em "membros"
-- (ou seja, NINGUÉM é dono desta barbearia ainda). O dono precisa ser uma
-- conta de verdade, criada por VOCÊ pelo site — veja o passo a passo
-- completo no RELATORIO.md, seção "Como ligar a barbearia de demonstração
-- à sua conta" (que agora também explica como RECRIAR a demo no dia de
-- cada apresentação, sem perder o vínculo com a sua conta). Há um modelo
-- comentado desse mesmo INSERT bem no final deste arquivo, pronto pra
-- descomentar e usar depois da 1ª vez que você já souber o email da conta.
--
-- SOBRE OS DADOS SEREM ALEATÓRIOS: a geração dos agendamentos (e dos 120
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
-- (isso TAMBÉM apaga o vínculo em "membros" — veja no RELATORIO.md como
-- religar sua conta como dona depois, ou use o modelo comentado no final
-- deste arquivo)
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
  -- 120 clientes (passo 5) — "nome || ' ' || sobrenome", sem repetir a
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
  -- que é feito, na hora de gerar os agendamentos (passo 6). O "pool" de
  -- CLIENTES virou uma tabela temporária (tmp_clientes_demo, criada no
  -- passo 5), não um array — porque agora cada cliente tem uma "cota" de
  -- visitas que precisa ser controlada enquanto os agendamentos são
  -- gerados, e isso é bem mais natural numa tabela do que num array solto.
  v_pool_barbeiros uuid[];
  v_pool_servicos uuid[]; -- com REPETIÇÃO: um serviço mais popular aparece mais vezes aqui, pra ter mais chance de ser sorteado (ver passo 3)
  v_pool_observacoes text[] := array[ -- uma observação ocasional, só pra dar vida real ao histórico (ver passo 6)
    'Cliente pediu máquina 1 nas laterais',
    'Pediu pra não mexer no topo',
    'Primeira vez na barbearia',
    'Cliente fiel, sempre no mesmo horário',
    'Trouxe foto de referência pelo WhatsApp',
    'Pediu produto pós-barba sem álcool'
  ];
  v_qtd_fieis int; -- quantos clientes (entre 10 e 15) vão virar "fiéis" (cota de 4 a 6 visitas) — ver passo 5

  -- variáveis do laço que gera os agendamentos (passo 6)
  v_hoje date;
  v_dia date;
  v_dia_semana int;
  v_probabilidade numeric; -- chance (0 a 1) de preencher CADA horário de 30min testado, varia por dia da semana
  v_barbeiro_id uuid;
  v_cursor timestamptz;         -- "ponteiro" andando pelo expediente do dia, barbeiro por barbeiro
  v_fim_expediente timestamptz;
  v_servico_id uuid;
  v_duracao_min int;
  v_preco_centavos int;
  v_fim_atendimento timestamptz;
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
    'SEU_NUMERO',                                        -- ⚠️ TROQUE AQUI pelo seu número de verdade (só dígitos, com DDD, ex: '11999998888') ANTES de rodar — é pra ele que o botão "Falar com a barbearia" liga
    'Rua Augusta, 1200 - Consolação, São Paulo - SP'     -- endereço fictício, só pra preencher a página pública
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

  v_pool_barbeiros := array[v_barbeiro_1, v_barbeiro_2, v_barbeiro_3]; -- usado no laço de agendamentos (passo 6), pra sortear quem atende

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
  -- sorteio" de cada agendamento (array_fill repete o id N vezes). O Corte
  -- Infantil continua aqui com peso baixo — o que realmente limita ele a
  -- "só alguns clientes" é a regra do passo 6, não o peso sozinho.
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
  -- 5) 120 CLIENTES FICTÍCIOS (nomes masculinos, cota de visitas, e quem é
  --    "pai" pro Corte Infantil)
  -- --------------------------------------------------------------------------
  -- tabela temporária (só existe durante esta sessão): guarda, pra cada
  -- cliente, quantas vezes ele DEVE aparecer no total (quota) e quantas já
  -- apareceu até agora (usados) — é isso que o passo 6 consulta toda vez
  -- que precisa sortear um cliente, respeitando o limite de cada um
  create temporary table tmp_clientes_demo (
    id uuid,                        -- preenchido mais abaixo, depois do insert em "clientes" de verdade
    nome text,
    telefone text,
    quota int,                      -- quantas visitas esse cliente deve ter, no total (passado + hoje + futuro)
    usados int not null default 0,  -- quantas vezes já foi sorteado até agora (nunca passa de "quota")
    tem_filho boolean not null default false -- true só pros ~5 clientes que podem levar um filho pro Corte Infantil
  );

  -- 120 nomes DISTINTOS: todas as combinações possíveis de primeiro nome x
  -- sobrenome (30 x 28 = 840 combinações) embaralhadas, pegando só as 120
  -- primeiras — como vem de um PRODUTO CARTESIANO sem repetir linha, é
  -- impossível sair "João Silva" duas vezes
  insert into tmp_clientes_demo (nome, quota)
  select pn.nome || ' ' || sn.nome, 0 -- "0" é só um valor provisório; a quota de verdade é definida nas 2 atualizações logo abaixo
  from unnest(v_primeiros_nomes) as pn(nome)
  cross join unnest(v_sobrenomes) as sn(nome)
  order by random()
  limit 120;

  -- quota-base: a MAIORIA dos clientes (os 120, antes do próximo update)
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

  -- telefone sequencial: '1190000' + 4 dígitos (0001, 0002...), nunca um
  -- número de verdade por acidente, e sempre com 11 dígitos (bate com a
  -- constraint "clientes_telefone_formato", que exige 10 ou 11 só-números —
  -- ver migration 003). "row_number() over (order by nome)" dá um número
  -- de 1 a 120 pra cada linha, sem repetir, e "lpad(...,4,'0')" completa
  -- com zeros à esquerda (1 -> "0001", 120 -> "0120")
  with numerados as (
    select nome, row_number() over (order by nome) as posicao
    from tmp_clientes_demo
  )
  update tmp_clientes_demo t
  set telefone = '1190000' || lpad(numerados.posicao::text, 4, '0')
  from numerados
  where t.nome = numerados.nome;

  -- grava os 120 clientes de verdade na tabela "clientes"...
  insert into clientes (barbearia_id, nome, telefone)
  select v_barbearia_id, nome, telefone from tmp_clientes_demo;

  -- ...e traz o "id" de volta pra tabela temporária (nome+telefone juntos
  -- identificam a linha certa sem ambiguidade, já que os dois são únicos)
  update tmp_clientes_demo t
  set id = c.id
  from clientes c
  where c.barbearia_id = v_barbearia_id and c.nome = t.nome and c.telefone = t.telefone;

  -- --------------------------------------------------------------------------
  -- 6) AGENDAMENTOS — próximos 5 dias, HOJE, e ~30 dias passados
  -- --------------------------------------------------------------------------
  -- Estratégia (igual nos 3 sub-passos 6a/6b/6c): pra CADA dia (terça a
  -- sábado) e CADA barbeiro, um "cursor" anda de 09:00 até 19:00 em passos
  -- de 30 minutos. A cada parada, sorteia se marca um atendimento ali
  -- (probabilidade maior sexta/sábado = "mais movimento"). Se marcar,
  -- sorteia o serviço (usando o "pool" com repetição do passo 3), sorteia
  -- um CLIENTE QUE AINDA TENHA COTA disponível (e, se o serviço sorteado
  -- foi Corte Infantil, só entre os marcados como "pai" — passo 5) e, se
  -- tudo isso couber até o fim do expediente, cria o agendamento e PULA o
  -- cursor pro fim desse atendimento — isso garante, por construção, que o
  -- mesmo barbeiro NUNCA fica com 2 agendamentos que se cruzam.
  --
  -- ORDEM IMPORTA: 6a (próximos dias) e 6b (hoje) rodam ANTES de 6c (os 30
  -- dias passados) de propósito — assim os clientes "disponíveis" (com
  -- cota sobrando) são reservados primeiro pra garantir que hoje e os
  -- próximos dias fiquem com agendamento, e só o que sobrar de cota vai
  -- pro preenchimento do histórico. Sem essa ordem, o histórico (que tem
  -- muito mais "tentativas") podia consumir a cota de todo mundo antes de
  -- chegar nos dias futuros.
  v_hoje := (now() at time zone 'America/Sao_Paulo')::date; -- "hoje" no fuso do Brasil, mesmo critério usado em todo o resto do site

  -- 6a) PRÓXIMOS 5 DIAS (agenda bem mais "vazia" que o histórico — é assim
  -- mesmo numa barbearia de verdade: a maior parte do futuro próximo ainda
  -- não foi preenchida pelos clientes)
  for v_dia in select generate_series(v_hoje + interval '1 day', v_hoje + interval '5 days', interval '1 day')::date loop
    v_dia_semana := extract(dow from v_dia)::int;
    if v_dia_semana not in (2, 3, 4, 5, 6) then
      continue; -- domingo/segunda: barbearia fechada
    end if;

    v_probabilidade := case v_dia_semana
      when 5 then 0.30
      when 6 then 0.35
      else 0.15
    end;

    foreach v_barbeiro_id in array v_pool_barbeiros loop
      v_cursor := (v_dia + time '09:00') at time zone 'America/Sao_Paulo';
      v_fim_expediente := (v_dia + time '19:00') at time zone 'America/Sao_Paulo';

      while v_cursor < v_fim_expediente loop
        if random() < v_probabilidade then
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int]; -- array 1-indexado no Postgres, por isso o "+1"
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then -- só tenta marcar se o serviço COUBER até o fim do expediente
            -- sorteia 1 cliente QUE AINDA TENHA COTA; se o serviço sorteado foi o infantil, só entre os "pais"
            if v_servico_id = v_servico_infantil then
              select id into v_cliente_id from tmp_clientes_demo where usados < quota and tem_filho = true order by random() limit 1;
            else
              select id into v_cliente_id from tmp_clientes_demo where usados < quota order by random() limit 1;
            end if;

            if v_cliente_id is not null then -- achou alguém com cota sobrando (e, se infantil, que seja "pai"): marca de verdade
              update tmp_clientes_demo set usados = usados + 1 where id = v_cliente_id;

              -- data futura: só "agendado" ou "confirmado" (nunca concluído/cancelado/faltou — isso só se sabe depois que o horário passar)
              v_status := case when random() < 0.5 then 'agendado'::status_agendamento else 'confirmado'::status_agendamento end;

              insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos, status)
              values (v_barbearia_id, v_barbeiro_id, v_cliente_id, v_servico_id, v_cursor, v_fim_atendimento, v_preco_centavos, v_status);

              v_cursor := v_fim_atendimento; -- pula o cursor pro fim deste atendimento (evita sobreposição com o próximo)
              continue; -- já avançou o cursor acima; não soma mais 30min embaixo
            end if;
            -- v_cliente_id ficou null (ninguém elegível com cota sobrando): não marca nada, cai pro avanço padrão de 30min, lá embaixo
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes'; -- esse horário não foi usado: avança o grid padrão
      end loop;
    end loop;
  end loop;

  -- 6b) O DIA DE HOJE: mistura dos dois jeitos — horários ANTES de "agora"
  -- recebem status de passado (concluído/cancelado/faltou, mesmas
  -- proporções do passo 6c); horários QUE AINDA NÃO CHEGARAM recebem
  -- status de futuro (agendado/confirmado), igual ao passo 6a. Se hoje for
  -- domingo ou segunda, o "if" abaixo nem entra — fica vazio mesmo
  -- (barbearia fechada), como já seria de esperar.
  v_dia_semana := extract(dow from v_hoje)::int;
  if v_dia_semana in (2, 3, 4, 5, 6) then
    v_probabilidade := case v_dia_semana -- mesma curva do passo 6c: hoje é só mais um dia comum de semana/fim de semana
      when 2 then 0.35
      when 3 then 0.35
      when 4 then 0.40
      when 5 then 0.60
      when 6 then 0.70
    end;

    foreach v_barbeiro_id in array v_pool_barbeiros loop
      v_cursor := (v_hoje + time '09:00') at time zone 'America/Sao_Paulo';
      v_fim_expediente := (v_hoje + time '19:00') at time zone 'America/Sao_Paulo';

      while v_cursor < v_fim_expediente loop
        if random() < v_probabilidade then
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int];
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then
            if v_servico_id = v_servico_infantil then
              select id into v_cliente_id from tmp_clientes_demo where usados < quota and tem_filho = true order by random() limit 1;
            else
              select id into v_cliente_id from tmp_clientes_demo where usados < quota order by random() limit 1;
            end if;

            if v_cliente_id is not null then
              update tmp_clientes_demo set usados = usados + 1 where id = v_cliente_id;

              if v_cursor < now() then -- esse horário já passou: status de passado, mesmas proporções do histórico (ver 6c)
                v_sorteio := random();
                v_status := case
                  when v_sorteio < 0.85 then 'concluido'::status_agendamento
                  when v_sorteio < 0.94 then 'cancelado'::status_agendamento
                  else 'faltou'::status_agendamento
                end;
                v_observacao := case when random() < 0.12
                  then v_pool_observacoes[1 + floor(random() * array_length(v_pool_observacoes, 1))::int]
                  else null
                end;
              else -- esse horário ainda não chegou: status de futuro, sem observação (igual ao passo 6a)
                v_status := case when random() < 0.5 then 'agendado'::status_agendamento else 'confirmado'::status_agendamento end;
                v_observacao := null;
              end if;

              insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos, status, observacao)
              values (v_barbearia_id, v_barbeiro_id, v_cliente_id, v_servico_id, v_cursor, v_fim_atendimento, v_preco_centavos, v_status, v_observacao);

              v_cursor := v_fim_atendimento;
              continue;
            end if;
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes';
      end loop;
    end loop;
  end if;

  -- 6c) ÚLTIMOS 30 DIAS (sem contar hoje, que já foi tratado no passo 6b):
  -- roda por ÚLTIMO de propósito (ver explicação no topo do passo 6) —
  -- preenche o histórico com o que sobrou de cota de cada cliente.
  for v_dia in select generate_series(v_hoje - interval '30 days', v_hoje - interval '1 day', interval '1 day')::date loop
    v_dia_semana := extract(dow from v_dia)::int;
    if v_dia_semana not in (2, 3, 4, 5, 6) then
      continue; -- domingo/segunda: barbearia fechada, nenhum agendamento possível nesse dia
    end if;

    -- mais movimento conforme o dia da semana: sexta e sábado bem mais cheios que o meio da semana
    v_probabilidade := case v_dia_semana
      when 2 then 0.35  -- terça
      when 3 then 0.35  -- quarta
      when 4 then 0.40  -- quinta
      when 5 then 0.60  -- sexta
      when 6 then 0.70  -- sábado
    end;

    foreach v_barbeiro_id in array v_pool_barbeiros loop
      v_cursor := (v_dia + time '09:00') at time zone 'America/Sao_Paulo';
      v_fim_expediente := (v_dia + time '19:00') at time zone 'America/Sao_Paulo';

      while v_cursor < v_fim_expediente loop
        if random() < v_probabilidade then
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int];
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then
            if v_servico_id = v_servico_infantil then
              select id into v_cliente_id from tmp_clientes_demo where usados < quota and tem_filho = true order by random() limit 1;
            else
              select id into v_cliente_id from tmp_clientes_demo where usados < quota order by random() limit 1;
            end if;

            if v_cliente_id is not null then
              update tmp_clientes_demo set usados = usados + 1 where id = v_cliente_id;

              -- status realista pra uma data que já passou: a maioria concluído,
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

              insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos, status, observacao)
              values (v_barbearia_id, v_barbeiro_id, v_cliente_id, v_servico_id, v_cursor, v_fim_atendimento, v_preco_centavos, v_status, v_observacao);

              v_cursor := v_fim_atendimento;
              continue;
            end if;
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes';
      end loop;
    end loop;
  end loop;

  drop table tmp_clientes_demo; -- limpeza: a tabela temporária não precisa mais existir (ela já cumpriu seu papel — os ids finais já estão em "clientes")

  -- --------------------------------------------------------------------------
  -- aviso final, só informativo (aparece na aba "Resultados"/mensagens do
  -- SQL Editor) — ajuda a conferir rapidamente que o seed rodou por inteiro
  -- --------------------------------------------------------------------------
  select count(*) into v_total_agendamentos from agendamentos where barbearia_id = v_barbearia_id;
  select count(distinct cliente_id) into v_total_clientes_usados from agendamentos where barbearia_id = v_barbearia_id;
  raise notice 'Seed concluído: barbearia % (id %), % agendamentos, % dos 120 clientes com pelo menos 1 visita. Falta só ligar o dono — ver RELATORIO.md. LEMBRETE: troque o telefone fictício ''SEU_NUMERO'' pelo seu de verdade, se ainda não trocou.',
    'demo', v_barbearia_id, v_total_agendamentos, v_total_clientes_usados;

end $$;

-- ============================================================================
-- MODELO (comentado) de como ligar um dono de verdade a esta barbearia —
-- o passo a passo completo está no RELATORIO.md. Resumindo: crie uma conta
-- pelo site (/cadastro) SEM preencher o formulário de "criar barbearia" do
-- onboarding, ache o id dela com o select abaixo, cole no lugar indicado, e
-- rode o insert (fora deste arquivo, como um comando separado):
--
-- select id, email from auth.users where email = 'SEU_EMAIL_AQUI';
--
-- insert into membros (barbearia_id, user_id, papel)
-- values (
--   (select id from barbearias where slug = 'demo'),
--   'COLE_AQUI_O_ID_ENCONTRADO_NO_SELECT_ACIMA',
--   'dono'
-- );
--
-- ATALHO pra quando você já SABE o email (ex: toda vez que recria a demo
-- antes de uma apresentação): troque só o email abaixo e rode este bloco
-- inteiro — ele já faz o select e o insert numa tacada só, sem precisar
-- copiar/colar nenhum id na mão. Descomente (tire o "--" do início de cada
-- linha) antes de rodar.
--
-- insert into membros (barbearia_id, user_id, papel)
-- select
--   (select id from barbearias where slug = 'demo'),
--   (select id from auth.users where email = 'SEU_EMAIL_AQUI'),
--   'dono';
-- ============================================================================
