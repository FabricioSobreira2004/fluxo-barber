// ============================================================================
// testar-funcoes-publicas.mjs
// Script TEMPORÁRIO pra testar as funções públicas do banco (as que a página
// /b/[slug] usa), simulando exatamente o que um visitante sem login faria:
// só com a Publishable key (nunca a Secret key), sem autenticação nenhuma.
// Roda com: node scripts/testar-funcoes-publicas.mjs
// Não tem nenhuma chave escrita no código: lê a URL e a chave do .env.local,
// igual o site faz.
//
// Pressupõe que o barbeiro "barbeiro1test" da barbearia "barbearia-teste" já
// tem horários de trabalho cadastrados (ex: segunda a quinta e sábado
// 09:00–18:00, sexta 09:00–19:00, domingo 20:00–23:59 só pra testar a
// virada da meia-noite). Sem isso, vários testes abaixo são pulados.
//
// IMPORTANTE sobre os horários escolhidos em cada teste: sempre busco a
// lista de horários livres DE NOVO (bem na hora) antes de escolher um
// horário pra agendar, e sempre pego o PRIMEIRO da lista. Isso evita um erro
// que cometi numa versão anterior deste script: reaproveitar índices de uma
// lista "velha" (de antes de outros agendamentos de teste) — como o serviço
// padrão dura 30min e os horários livres são gerados a cada 15min, dois
// índices vizinhos (ex: índice 0 e índice 1) na verdade se SOBREPÕEM, então
// agendar os dois dava erro de conflito de horário em vez de testar o que eu
// queria. Buscando de novo antes de cada agendamento, o índice 0 é sempre
// "o próximo horário realmente livre nesse momento".
// ============================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function carregarEnvLocal() { // lê NEXT_PUBLIC_SUPABASE_URL e a Publishable key do .env.local, sem escrever segredo no código
  const conteudo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const variaveis = {};
  for (const linha of conteudo.split("\n")) {
    const semComentario = linha.trim();
    if (!semComentario || semComentario.startsWith("#")) continue;
    const indiceIgual = semComentario.indexOf("=");
    if (indiceIgual === -1) continue;
    variaveis[semComentario.slice(0, indiceIgual).trim()] = semComentario.slice(indiceIgual + 1).trim();
  }
  return variaveis;
}

const env = carregarEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); // conexão pública, igual ao visitante da página /b/[slug]

// ----------------------------------------------------------------------------
// Utilitários de data/hora (versão mínima dos mesmos de utils/data.ts, só
// pra este script não depender do TypeScript do projeto)
// ----------------------------------------------------------------------------
function somarDias(dataISO, quantidade) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + quantidade)).toISOString().slice(0, 10);
}
function hojeISO() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
function diaDaSemana(dataISO) { // 0 (domingo) a 6 (sábado), mesmo padrão de horarios_trabalho.dia_semana
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 12)).getUTCDay();
}
function somarMinutosSemVirar(horaHHMM, minutos) { // ex: "23:00" + 50min -> {totalMin: 1430}; NÃO faz módulo 24h (pra comparar se "passou" de 23:59)
  const [h, m] = horaHHMM.split(":").map(Number);
  return { totalMin: h * 60 + m + minutos };
}

// ----------------------------------------------------------------------------
// Telefones de teste, todos na faixa "2190000000X" (fácil de achar e apagar
// depois -- ver TESTES.md pro SQL de limpeza). Os 2 marcados "(pedido pelo
// usuário)" usam exatamente o número pedido nas instruções desta rodada.
// ----------------------------------------------------------------------------
const TEL = {
  falhas: "21900000000", // reaproveitado em todo teste que deve ser RECUSADO (nunca gera cliente salvo, então não tem problema repetir)
  telefoneFormatado: "21900000001", // (pedido pelo usuário) teste "telefone formatado deve ser aceito"
  mais55: "21900000002", // (pedido pelo usuário, sem o "55") teste "+55 deve ser aceito depois da migration 004"
  antiSpam: "21900000009", // teste de limite de 3 agendamentos futuros (ver nota abaixo sobre reaproveitar número)
  conflitoA: "21900000008", // única parte do teste de conflito que realmente grava cliente (a 2ª tentativa falha); divide o número com "ui" abaixo -- cada um só cria 1 agendamento, então os dois juntos não chegam no limite de 3
  nomeComEspacos: "21900000005", // teste "nome válido com espaços nas pontas"
  domingoAceita: "21900000006", // teste da virada da meia-noite: horário que CABE antes de 23:59
  listaLivres: "21900000007", // teste de listar_horarios_livres antes/depois de agendar
  ui: "21900000008", // reservado pro teste feito no navegador (não usado por este script -- ver nota do "conflitoA" acima)
  // nota sobre o "antiSpam" usar o sufixo 9 (e não 3, que seria o próximo da sequência): como este
  // script já tinha rodado antes durante o desenvolvimento, o telefone "...0003" já tinha batido no
  // limite de 3 agendamentos futuros em rodadas anteriores -- troquei pra um número ainda "zerado",
  // senão o teste 3 falharia só por causa de agendamentos de teste velhos, não por um bug de verdade.
  // Isso não afeta a limpeza: o SQL em TESTES.md apaga TODO telefone "2190000000%", não um por um.
};

const resultados = [];
function registrar(teste, esperado, obtido, passou) {
  resultados.push({ teste, esperado, obtido, passou });
  const rotulo = passou === null ? "⏭️  PULADO" : passou ? "✅ PASSOU" : "❌ FALHOU";
  console.log(`${rotulo} — ${teste}`);
  console.log(`   esperado: ${esperado}`);
  console.log(`   obtido:   ${obtido}\n`);
}

async function tentarAgendar({ barbeariaId, barbeiroId, servicoId, data, hora, nome, telefone }) { // nunca lança exceção, pro script seguir mesmo se um teste falhar
  const { data: id, error } = await supabase.rpc("criar_agendamento_publico", {
    p_barbearia_id: barbeariaId, p_barbeiro_id: barbeiroId, p_servico_id: servicoId,
    p_data: data, p_hora: hora, p_nome_cliente: nome, p_telefone_cliente: telefone,
  });
  return { id, erro: error };
}

async function horariosLivresEm(barbeiroId, data, servicoId) { // devolve só as strings "HH:MM", já sem segundos
  const { data: livres } = await supabase.rpc("listar_horarios_livres", { p_barbeiro_id: barbeiroId, p_data: data, p_servico_id: servicoId });
  return (livres ?? []).map((h) => h.horario.slice(0, 5));
}

// agenda usando sempre o PRIMEIRO horário livre NESTE EXATO MOMENTO (busca de novo antes de agendar) -- ver o
// comentário grande no topo do arquivo sobre por que isso é necessário (evita colisão com índices "velhos")
async function agendarProximoLivre(contexto, { barbeiroId, servicoId, data, nome, telefone }) {
  const livresAgora = await horariosLivresEm(barbeiroId, data, servicoId);
  if (!livresAgora.length) return { erro: { message: `(sem horário livre nesse momento pra "${contexto}")` }, id: null, horarioUsado: null };
  const horarioUsado = livresAgora[0];
  const resultado = await tentarAgendar({ barbeariaId: contexto.barbeariaId, barbeiroId, servicoId, data, hora: horarioUsado, nome, telefone });
  return { ...resultado, horarioUsado };
}

async function main() {
  console.log("== 1) Confirmando a barbearia de teste pelo slug ==\n");
  const { data: linhasBarbearia, error: erroBarbearia } = await supabase.rpc("buscar_barbearia_publica", { p_slug: "barbearia-teste" });
  if (erroBarbearia || !linhasBarbearia?.length) {
    console.error("Não encontrei a barbearia 'barbearia-teste'. Erro:", erroBarbearia);
    process.exitCode = 1;
    return;
  }
  const barbearia = linhasBarbearia[0];
  console.log(`Barbearia: "${barbearia.nome}" (${barbearia.id})\n`);

  const { data: barbeiros } = await supabase.rpc("listar_barbeiros_publicos", { p_barbearia_id: barbearia.id });
  const { data: servicos } = await supabase.rpc("listar_servicos_publicos", { p_barbearia_id: barbearia.id });
  if (!barbeiros?.length || !servicos?.length) {
    console.error("Sem barbeiro ativo e/ou serviço ativo cadastrado. Parando.");
    process.exitCode = 1;
    return;
  }
  const barbeiro = barbeiros[0];
  const servicoPadrao = servicos[0]; // "corte de maquina", 30min -- usado na maioria dos testes
  const servico50 = servicos.find((s) => s.duracao_min === 50) ?? servicoPadrao; // precisa de 50min pro teste da virada da meia-noite
  console.log(`Barbeiro: "${barbeiro.nome}" | Serviço padrão: "${servicoPadrao.nome}" (${servicoPadrao.duracao_min}min) | Serviço 50min: "${servico50.nome}"\n`);

  const ctx = { barbeariaId: barbearia.id }; // só pra não repetir barbeariaId em toda chamada de agendarProximoLivre

  // --------------------------------------------------------------------------
  // 2) Acha o primeiro dia de SEMANA (não-domingo) com vaga, e o primeiro
  // DOMINGO dos próximos 14 dias (pro teste da virada da meia-noite)
  // --------------------------------------------------------------------------
  console.log("== 2) Procurando datas de teste (a partir de amanhã) ==\n");
  let dataSemana = null, livresSemanaPristina = []; // "pristina" = capturada ANTES de qualquer agendamento de teste tocar nesse dia
  let dataDomingo = null, livresDomingoServico50 = [];

  for (let i = 1; i <= 14; i++) {
    const d = somarDias(hojeISO(), i);
    if (diaDaSemana(d) === 0) { // domingo
      if (!dataDomingo) {
        const livres = await horariosLivresEm(barbeiro.id, d, servico50.id);
        if (livres.length > 0) { dataDomingo = d; livresDomingoServico50 = livres; }
      }
      continue;
    }
    if (!dataSemana) {
      const livres = await horariosLivresEm(barbeiro.id, d, servicoPadrao.id);
      if (livres.length > 0) { dataSemana = d; livresSemanaPristina = livres; }
    }
    if (dataSemana && dataDomingo) break;
  }

  console.log(dataSemana ? `Dia de semana com vaga: ${dataSemana} (${livresSemanaPristina.length} livres, 09:00–18:00 ou 09:00–19:00)` : "⚠️  Nenhum dia de semana com vaga encontrado.");
  console.log(dataDomingo ? `Domingo com vaga: ${dataDomingo} (${livresDomingoServico50.length} livres, serviço de ${servico50.duracao_min}min)\n` : "⚠️  Nenhum domingo com vaga encontrado nos próximos 14 dias.\n");

  // ==========================================================================
  // TESTE 1 — validação de nome (não depende de horário livre)
  // ==========================================================================
  console.log("== TESTE 1: validação de nome ==\n");
  const dataQualquer = dataSemana ?? somarDias(hojeISO(), 1);
  const horaQualquer = livresSemanaPristina[0] ?? "10:00"; // só usado nos sub-testes que DEVEM falhar antes de checar o horário

  for (const [rotulo, nome] of [["1a) 1 letra", "A"], ["1b) só espaços", "      "], ["1c) 101 caracteres", "A".repeat(101)]]) {
    const { erro } = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataQualquer, hora: horaQualquer, nome, telefone: TEL.falhas });
    registrar(rotulo, "erro 'Nome precisa ter entre 2 e 100 caracteres'", erro ? erro.message : "(aceitou -- não deveria)", !!erro && erro.message.includes("Nome precisa ter entre 2 e 100"));
  }

  if (dataSemana) {
    const nomeComEspacos = " TESTE CLAUDE " + "A".repeat(85) + " "; // cru: 101 caracteres; sem os espaços: 99 -- só passa se o banco der trim ANTES de validar
    const { id, erro, horarioUsado } = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: nomeComEspacos, telefone: TEL.nomeComEspacos });
    registrar("1d) nome válido com espaços nas pontas (prova que salva sem eles)", "agendamento criado com sucesso", erro ? `erro: ${erro.message}` : `sucesso às ${horarioUsado}, id: ${id}`, !erro && !!id);
  } else {
    registrar("1d) nome válido com espaços nas pontas", "agendamento criado com sucesso", "PULADO (sem dia de semana com vaga)", null);
  }

  // ==========================================================================
  // TESTE 2 — validação de telefone
  // ==========================================================================
  console.log("== TESTE 2: validação de telefone ==\n");

  for (const [rotulo, telefone] of [["2a) 9 dígitos", "219000021"], ["2b) 12 dígitos aleatórios", "219000002299"]]) {
    const { erro } = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataQualquer, hora: horaQualquer, nome: "TESTE CLAUDE Validacao", telefone });
    registrar(rotulo, "erro 'Telefone precisa ter 10 ou 11 números'", erro ? erro.message : "(aceitou -- não deveria)", !!erro && erro.message.includes("Telefone precisa ter 10 ou 11"));
  }

  if (dataSemana) {
    const c = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: "TESTE CLAUDE Telefone Formatado", telefone: "(21) 90000-0001" });
    registrar("2c) telefone formatado '(21) 90000-0001' (prova que salva só dígitos)", "agendamento criado com sucesso", c.erro ? `erro: ${c.erro.message}` : `sucesso às ${c.horarioUsado}, id: ${c.id}`, !c.erro && !!c.id);

    const d = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: "TESTE CLAUDE Mais55", telefone: "+55 21 90000-0002" });
    registrar("2d) telefone '+55 21 90000-0002' (migration 004 já aplicada -- agora deve ACEITAR)", "agendamento criado com sucesso, salvo como 21900000002 (sem o 55)", d.erro ? `erro: ${d.erro.message}` : `sucesso às ${d.horarioUsado}, id: ${d.id}`, !d.erro && !!d.id);
  } else {
    registrar("2c) telefone formatado", "agendamento criado com sucesso", "PULADO (sem dia de semana com vaga)", null);
    registrar("2d) telefone com +55", "agendamento criado com sucesso", "PULADO (sem dia de semana com vaga)", null);
  }

  // ==========================================================================
  // TESTE 5 — fim do expediente comum (dia de semana). Em vez de derivar o
  // "horário que não cabe" a partir do último horário livre (como numa
  // versão anterior deste script), uso direto o horário de FECHAMENTO que
  // você me passou (18:00 nos outros dias, 19:00 na sexta) como o próprio
  // p_hora: começar o atendimento EXATAMENTE no fechamento sempre estoura o
  // expediente, não importa a duração do serviço. Isso também evita colidir
  // com algum agendamento de teste de uma rodada anterior que ainda não foi
  // limpo do banco -- o horário de fechamento em si nunca é um horário
  // "reservável" (listar_horarios_livres nunca devolve ele), então ninguém
  // nunca conseguiu agendar exatamente nesse instante antes.
  // ==========================================================================
  console.log("== TESTE 5: fim do expediente, dia de semana ==\n");
  if (dataSemana) {
    const fimExpedienteSemana = diaDaSemana(dataSemana) === 5 ? "19:00" : "18:00"; // sexta = 19:00; os demais dias cadastrados = 18:00
    const { erro, id } = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, hora: fimExpedienteSemana, nome: "TESTE CLAUDE Fronteira Semana", telefone: TEL.falhas });
    registrar(`5) horário ${fimExpedienteSemana} (exatamente o fechamento), serviço de ${servicoPadrao.duracao_min}min`, "recusado, 'Horário fora do expediente do barbeiro'", erro ? erro.message : `(aceitou -- id ${id})`, !!erro && erro.message.includes("fora do expediente"));
  } else {
    registrar("5) fim do expediente, dia de semana", "horário logo após o expediente é recusado", "PULADO (sem dia de semana com vaga)", null);
  }

  // ==========================================================================
  // TESTE 3 — anti-spam (máx. 3 agendamentos futuros não cancelados por telefone)
  // ==========================================================================
  console.log("== TESTE 3: anti-spam (limite de 3 agendamentos futuros) ==\n");
  if (dataSemana) {
    for (let i = 0; i < 3; i++) {
      const r = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: "TESTE CLAUDE Antispam", telefone: TEL.antiSpam });
      registrar(`3.${i + 1}) ${i + 1}º agendamento futuro com o mesmo telefone`, "criado com sucesso", r.erro ? `erro: ${r.erro.message}` : `sucesso às ${r.horarioUsado}, id: ${r.id}`, !r.erro && !!r.id);
    }
    const r4 = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: "TESTE CLAUDE Antispam", telefone: TEL.antiSpam });
    registrar("3.4) 4º agendamento futuro com o mesmo telefone", "recusado, mencionando o limite de 3 agendamentos futuros", r4.erro ? r4.erro.message : `(aceitou às ${r4.horarioUsado} -- não deveria)`, !!r4.erro && r4.erro.message.toLowerCase().includes("3 agendamentos"));
  } else {
    registrar("3) anti-spam (3 aceitos + 4º bloqueado)", "3 aceitos, 4º bloqueado", "PULADO (sem dia de semana com vaga)", null);
  }

  // ==========================================================================
  // TESTE 4 — conflito de horário
  // ==========================================================================
  console.log("== TESTE 4: conflito de horário ==\n");
  if (dataSemana) {
    const a = await agendarProximoLivre(ctx, { barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, nome: "TESTE CLAUDE Conflito", telefone: TEL.conflitoA });
    registrar("4a) 1º agendamento nesse horário", "criado com sucesso", a.erro ? `erro: ${a.erro.message}` : `sucesso às ${a.horarioUsado}, id: ${a.id}`, !a.erro && !!a.id);

    if (a.horarioUsado) { // só faz sentido tentar colidir se o 1º deu certo
      const b = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, hora: a.horarioUsado, nome: "TESTE CLAUDE Conflito 2", telefone: TEL.falhas });
      registrar(`4b) 2º agendamento no MESMO horário (${a.horarioUsado}) e barbeiro (deve colidir)`, "recusado com código 23P01", b.erro ? `erro: ${b.erro.message} (código: ${b.erro.code})` : "(aceitou -- não deveria)", !!b.erro && b.erro.code === "23P01");
    } else {
      registrar("4b) 2º agendamento no mesmo horário", "recusado com código 23P01", "PULADO (4a não conseguiu um horário)", null);
    }
  } else {
    registrar("4) conflito de horário", "2º agendamento recusado (23P01)", "PULADO (sem dia de semana com vaga)", null);
  }

  // ==========================================================================
  // TESTE 6 — virada da meia-noite (domingo 20:00–23:59)
  // ==========================================================================
  console.log("== TESTE 6: virada da meia-noite, domingo 20:00–23:59 ==\n");
  if (dataDomingo) {
    // mesma ideia do TESTE 5: uso "23:59" (o próprio fechamento) como p_hora, em vez de derivar do
    // último horário livre -- além de imune a sobras de rodadas de teste anteriores, isso faz o
    // atendimento (50min) terminar às 00:49 do dia SEGUINTE, cruzando a meia-noite de verdade, que é
    // exatamente o cenário que tinha o bug corrigido na migration 003
    const horarioQueNaoCabe = "23:59";
    const { erro, id } = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico50.id, data: dataDomingo, hora: horarioQueNaoCabe, nome: "TESTE CLAUDE Meia Noite Recusa", telefone: TEL.falhas });
    registrar(`6a) domingo ${horarioQueNaoCabe} + ${servico50.duracao_min}min cruzaria a meia-noite (terminaria 00:49 do dia seguinte)`, "recusado, 'Horário fora do expediente do barbeiro'", erro ? erro.message : `(aceitou -- id ${id}, ISSO SERIA O BUG DA MEIA-NOITE DE VOLTA)`, !!erro && erro.message.includes("fora do expediente"));

    // busca a lista de novo (bem na hora) e pega o ÚLTIMO horário ainda livre -- é o que fica mais
    // perto da fronteira das 23:59, o melhor caso pra provar que "cabe por pouco" é aceito
    const livresDomingoAgora = await horariosLivresEm(barbeiro.id, dataDomingo, servico50.id);
    const ultimoLivreDomingoAgora = livresDomingoAgora[livresDomingoAgora.length - 1];
    if (ultimoLivreDomingoAgora) {
      const { id: idAceita, erro: erroAceita } = await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico50.id, data: dataDomingo, hora: ultimoLivreDomingoAgora, nome: "TESTE CLAUDE Meia Noite Aceita", telefone: TEL.domingoAceita });
      registrar(`6b) domingo ${ultimoLivreDomingoAgora} (último horário que ainda cabe antes de 23:59)`, "agendamento criado com sucesso", erroAceita ? `erro: ${erroAceita.message}` : `sucesso, id: ${idAceita}`, !erroAceita && !!idAceita);
    } else {
      registrar("6b) domingo: horário que cabe antes de 23:59", "agendamento criado com sucesso", "PULADO (não sobrou horário livre nesse domingo)", null);
    }

    const passaDe2359 = livresDomingoServico50.some((h) => somarMinutosSemVirar(h, servico50.duracao_min).totalMin > 23 * 60 + 59);
    registrar("6c) nenhum horário de listar_horarios_livres (domingo) ultrapassa 23:59 somando a duração", "false (nenhum ultrapassa)", `${passaDe2359} (horários: ${livresDomingoServico50.join(", ")})`, !passaDe2359);
  } else {
    registrar("6a) domingo: horário que ultrapassaria 23:59", "recusado", "PULADO (sem domingo com vaga nos próximos 14 dias)", null);
    registrar("6b) domingo: horário que cabe antes de 23:59", "aceito", "PULADO (sem domingo com vaga nos próximos 14 dias)", null);
    registrar("6c) listar_horarios_livres (domingo) nunca ultrapassa 23:59", "nenhum horário ultrapassa", "PULADO (sem domingo com vaga nos próximos 14 dias)", null);
  }

  // ==========================================================================
  // TESTE 7 — listar_horarios_livres reflete os agendamentos já feitos
  // ==========================================================================
  console.log("== TESTE 7: listar_horarios_livres some com o horário ocupado ==\n");
  if (dataSemana) {
    const antes = await horariosLivresEm(barbeiro.id, dataSemana, servicoPadrao.id);
    if (antes.length > 0) {
      const candidato = antes[0];
      await tentarAgendar({ barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servicoPadrao.id, data: dataSemana, hora: candidato, nome: "TESTE CLAUDE Lista Livres", telefone: TEL.listaLivres });
      const depois = await horariosLivresEm(barbeiro.id, dataSemana, servicoPadrao.id);
      registrar(`7) horário ${candidato} some da lista depois de agendado`, `'${candidato}' não aparece mais em listar_horarios_livres`, depois.includes(candidato) ? `ainda aparece: [${depois.join(", ")}]` : `sumiu (lista agora com ${depois.length} horário(s))`, !depois.includes(candidato));
    } else {
      registrar("7) listar_horarios_livres reflete agendamento", "horário some da lista", "PULADO (não sobrou horário livre nesse dia depois dos testes anteriores)", null);
    }
  } else {
    registrar("7) listar_horarios_livres reflete agendamento", "horário some da lista", "PULADO (sem dia de semana com vaga)", null);
  }

  console.log("\n\n========== RESUMO (JSON) ==========\n");
  console.log(JSON.stringify(resultados, null, 2));
}

main().catch((erro) => {
  console.error("Erro inesperado rodando o script:", erro);
  process.exitCode = 1;
});
