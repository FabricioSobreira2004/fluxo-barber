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
--     /b/demo), com telefone e endereço fictícios;
--   - 3 barbeiros;
--   - 8 serviços, com preço de mercado (corte, barba, combo, sobrancelha,
--     infantil, pigmentação, luzes e hidratação);
--   - horário de trabalho de terça a sábado, 9h às 19h, pros 3 barbeiros;
--   - 25 clientes fictícios (nomes + telefones válidos, DDD 11);
--   - agendamentos dos ÚLTIMOS 30 DIAS (concluídos, alguns cancelados/faltou)
--     e dos PRÓXIMOS 5 DIAS (agendados/confirmados), com mais movimento às
--     sextas e sábados — pra agenda e faturamento aparecerem preenchidos
--     numa demonstração ao vivo.
--
-- O QUE ESTE ARQUIVO **NÃO** CRIA, DE PROPÓSITO: nenhuma linha em "membros"
-- (ou seja, NINGUÉM é dono desta barbearia ainda). O dono precisa ser uma
-- conta de verdade, criada por VOCÊ pelo site — veja o passo a passo
-- completo (e o INSERT pronto pra colar depois) no RELATORIO.md, seção
-- "Como ligar a barbearia de demonstração à sua conta". Há também um modelo
-- comentado desse mesmo INSERT bem no final deste arquivo, só pra
-- referência rápida.
--
-- SOBRE OS DADOS SEREM ALEATÓRIOS: a geração dos agendamentos usa random(),
-- então a quantidade exata e quem atendeu quem muda um pouco a cada vez que
-- você roda este arquivo — de propósito, pra não parecer uma demonstração
-- "robotizada", sempre idêntica. A distribuição por dia da semana (mais
-- movimento sexta/sábado) e o volume geral, porém, continuam realistas em
-- qualquer execução.
--
-- SOBRE RODAR DUAS VEZES: o script para com um erro amigável se já existir
-- uma barbearia com slug "demo" (pra não criar duplicata por engano). Se
-- quiser recomeçar do zero, apague a barbearia antes — o "on delete cascade"
-- das migrations já leva barbeiros/serviços/horários/clientes/agendamentos
-- junto, numa linha só:
--   delete from barbearias where slug = 'demo';
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

  -- "pools" (conjuntos) usados pra sortear aleatoriamente quem atende, o que
  -- é feito e quem é o cliente, na hora de gerar os agendamentos lá embaixo
  v_pool_barbeiros uuid[];
  v_pool_servicos uuid[]; -- com REPETIÇÃO: um serviço mais popular aparece mais vezes aqui, pra ter mais chance de ser sorteado (ver passo 3)
  v_pool_clientes uuid[];
  v_pool_observacoes text[] := array[ -- uma observação ocasional, só pra dar vida real ao histórico (ver passo 6)
    'Cliente pediu máquina 1 nas laterais',
    'Pediu pra não mexer no topo',
    'Primeira vez na barbearia',
    'Cliente fiel, sempre no mesmo horário',
    'Trouxe foto de referência pelo WhatsApp',
    'Pediu produto pós-barba sem álcool'
  ];

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
    '11998765432',                                       -- celular fictício (DDD 11 = São Paulo), 11 dígitos, formato que a constraint de clientes também exige
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
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Corte Infantil (até 12 anos)', 30, 3500, true) returning id into v_servico_infantil; -- R$ 35,00 — um pouco mais barato que o corte adulto, prática comum
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Pigmentação de Barba', 30, 5000, true) returning id into v_servico_pigmentacao; -- R$ 50,00 — serviço "premium", menos frequente
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Luzes / Platinado', 90, 15000, true) returning id into v_servico_luzes; -- R$ 150,00 — o mais caro e demorado, raro no dia a dia
  insert into servicos (barbearia_id, nome, duracao_min, preco_centavos, ativo) values (v_barbearia_id, 'Hidratação Capilar', 30, 4000, true) returning id into v_servico_hidratacao; -- R$ 40,00

  -- "pool" COM REPETIÇÃO, pra sortear um serviço mais tarde com popularidade
  -- realista: corte/barba/combo aparecem muito mais vezes aqui do que
  -- pigmentação/luzes, por exemplo, então têm muito mais chance de "sair no
  -- sorteio" de cada agendamento (array_fill repete o id N vezes)
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
  -- 5) 25 CLIENTES FICTÍCIOS (nome + telefone já no formato que a constraint
  --    "clientes_telefone_formato" exige: só dígitos, 10 ou 11 números)
  -- --------------------------------------------------------------------------
  insert into clientes (barbearia_id, nome, telefone) values
    (v_barbearia_id, 'Ana Paula Ferreira', '11999110011'),
    (v_barbearia_id, 'Juliana Ribeiro', '11999110022'),
    (v_barbearia_id, 'Marcos Vinícius Lima', '11999110033'),
    (v_barbearia_id, 'Pedro Henrique Santos', '11999110044'),
    (v_barbearia_id, 'Fernanda Costa', '11999110055'),
    (v_barbearia_id, 'Gustavo Almeida', '11999110066'),
    (v_barbearia_id, 'Camila Rodrigues', '11999110077'),
    (v_barbearia_id, 'Lucas Martins', '11999110088'),
    (v_barbearia_id, 'Beatriz Oliveira', '11999110099'),
    (v_barbearia_id, 'Thiago Pereira', '11999220011'),
    (v_barbearia_id, 'Larissa Souza', '11999220022'),
    (v_barbearia_id, 'Rodrigo Carvalho', '11999220033'),
    (v_barbearia_id, 'Mariana Gomes', '11999220044'),
    (v_barbearia_id, 'Felipe Barbosa', '11999220055'),
    (v_barbearia_id, 'Carolina Dias', '11999220066'),
    (v_barbearia_id, 'Eduardo Nunes', '11999220077'),
    (v_barbearia_id, 'Patrícia Rocha', '11999220088'),
    (v_barbearia_id, 'André Teixeira', '11999220099'),
    (v_barbearia_id, 'Vanessa Cardoso', '11999330011'),
    (v_barbearia_id, 'Diego Moreira', '11999330022'),
    (v_barbearia_id, 'Renata Araújo', '11999330033'),
    (v_barbearia_id, 'Leonardo Castro', '11999330044'),
    (v_barbearia_id, 'Priscila Monteiro', '11999330055'),
    (v_barbearia_id, 'Vinícius Correia', '11999330066'),
    (v_barbearia_id, 'Bruna Fonseca', '11999330077');

  select array_agg(id) into v_pool_clientes from clientes where barbearia_id = v_barbearia_id; -- junta os 25 ids pra sortear um por vez, lá no passo 6

  -- --------------------------------------------------------------------------
  -- 6) AGENDAMENTOS — ~30 dias passados + 5 dias futuros
  -- --------------------------------------------------------------------------
  -- Estratégia: pra CADA dia (terça a sábado) e CADA barbeiro, um "cursor"
  -- anda de 09:00 até 19:00 em passos de 30 minutos. A cada parada, sorteia
  -- se marca um atendimento ali (probabilidade maior sexta/sábado = "mais
  -- movimento", como pedido). Se marcar, sorteia o serviço (usando o "pool"
  -- com repetição do passo 3) e, se ele couber até o fim do expediente, cria
  -- o agendamento e PULA o cursor pro fim desse atendimento — isso garante,
  -- por construção, que o mesmo barbeiro NUNCA fica com 2 agendamentos que
  -- se cruzam (a trava "sem_conflito_de_horario" do banco nem chega a ser
  -- testada, porque o script já não tenta criar a sobreposição).
  v_hoje := (now() at time zone 'America/Sao_Paulo')::date; -- "hoje" no fuso do Brasil, mesmo critério usado em todo o resto do site

  -- 6a) dias PASSADOS: de 30 dias atrás até ontem (hoje fica de fora, pra não
  -- misturar "passado" com horários que ainda não chegaram no dia de hoje)
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
          -- sorteia 1 serviço do pool ponderado (array 1-indexado no Postgres, por isso o "+1")
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int];
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then -- só marca se o serviço COUBER até o fim do expediente
            v_cliente_id := v_pool_clientes[1 + floor(random() * array_length(v_pool_clientes, 1))::int];

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

            v_cursor := v_fim_atendimento; -- pula o cursor pro fim deste atendimento (evita sobreposição com o próximo)
            continue; -- já avançou o cursor acima; não soma mais 30min embaixo
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes'; -- esse horário não foi usado (sorteio não bateu, ou o serviço não coube): avança o grid padrão
      end loop;
    end loop;
  end loop;

  -- 6b) dias FUTUROS: dos próximos 5 dias, com uma agenda bem mais "vazia"
  -- que o histórico (é assim mesmo numa barbearia de verdade: a maior parte
  -- do futuro próximo ainda não foi preenchida pelos clientes)
  for v_dia in select generate_series(v_hoje + interval '1 day', v_hoje + interval '5 days', interval '1 day')::date loop
    v_dia_semana := extract(dow from v_dia)::int;
    if v_dia_semana not in (2, 3, 4, 5, 6) then
      continue;
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
          v_servico_id := v_pool_servicos[1 + floor(random() * array_length(v_pool_servicos, 1))::int];
          select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos from servicos where id = v_servico_id;
          v_fim_atendimento := v_cursor + make_interval(mins => v_duracao_min);

          if v_fim_atendimento <= v_fim_expediente then
            v_cliente_id := v_pool_clientes[1 + floor(random() * array_length(v_pool_clientes, 1))::int];

            -- data futura: só "agendado" ou "confirmado" (nunca concluído/cancelado/faltou — isso só se sabe depois que o horário passar)
            v_status := case when random() < 0.5 then 'agendado'::status_agendamento else 'confirmado'::status_agendamento end;

            insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos, status)
            values (v_barbearia_id, v_barbeiro_id, v_cliente_id, v_servico_id, v_cursor, v_fim_atendimento, v_preco_centavos, v_status);

            v_cursor := v_fim_atendimento;
            continue;
          end if;
        end if;

        v_cursor := v_cursor + interval '30 minutes';
      end loop;
    end loop;
  end loop;

  -- --------------------------------------------------------------------------
  -- aviso final, só informativo (aparece na aba "Resultados"/mensagens do
  -- SQL Editor) — ajuda a conferir rapidamente que o seed rodou por inteiro
  -- --------------------------------------------------------------------------
  select count(*) into v_total_agendamentos from agendamentos where barbearia_id = v_barbearia_id;
  raise notice 'Seed concluído: barbearia % (id %) com % agendamentos. Falta só ligar o dono — ver RELATORIO.md.', 'demo', v_barbearia_id, v_total_agendamentos;

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
-- ============================================================================
