// ============================================================================
// testar-funcoes-publicas.mjs
// Script TEMPORÁRIO pra testar as funções públicas do banco (as que a página
// /b/[slug] usa), simulando exatamente o que um visitante sem login faria:
// só com a Publishable key (nunca a Secret key), sem autenticação nenhuma.
// Roda com: node scripts/testar-funcoes-publicas.mjs
// Apague este arquivo depois de usar (ou mantenha, mas ele não tem segredo
// nenhum escrito nele: lê as chaves do .env.local, igual o site faz).
// ============================================================================

import { readFileSync } from "node:fs"; // só pra ler o .env.local e pegar a URL/chave pública, sem escrever segredo no código
import { createClient } from "@supabase/supabase-js"; // mesmo cliente que o site usa

// ----------------------------------------------------------------------------
// Carrega NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY do
// .env.local na mão (não uso a Secret key -- ela nem está nessas variáveis).
// Isso evita colar qualquer chave direto no código deste arquivo.
// ----------------------------------------------------------------------------
function carregarEnvLocal() {
  const conteudo = readFileSync(new URL("../.env.local", import.meta.url), "utf8"); // arquivo na raiz do projeto
  const variaveis = {};
  for (const linha of conteudo.split("\n")) { // cada linha é "CHAVE=valor"
    const semComentario = linha.trim();
    if (!semComentario || semComentario.startsWith("#")) continue; // ignora linha vazia ou comentário
    const indiceIgual = semComentario.indexOf("=");
    if (indiceIgual === -1) continue;
    const chave = semComentario.slice(0, indiceIgual).trim();
    const valor = semComentario.slice(indiceIgual + 1).trim();
    variaveis[chave] = valor;
  }
  return variaveis;
}

const env = carregarEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); // conexão pública, igual ao visitante da página /b/[slug]

// ----------------------------------------------------------------------------
// Utilitários de data (versão mínima dos mesmos usados em utils/data.ts, só
// pra este script não depender do TypeScript do projeto)
// ----------------------------------------------------------------------------
function somarDias(dataISO, quantidade) { // ex: somarDias("2026-10-04", 1) -> "2026-10-05"
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade));
  return data.toISOString().slice(0, 10);
}
function hojeISO() { // data de hoje no fuso do Brasil, "AAAA-MM-DD"
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
function somarMinutos(horaHHMM, minutos) { // ex: somarMinutos("18:00", 15) -> "18:15"; não trata virada de dia (não precisamos aqui)
  const [h, m] = horaHHMM.split(":").map(Number);
  const totalMin = h * 60 + m + minutos;
  const hh = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60); // "%1440" trata o caso (raro, mas possível) de passar de 24h
  const mm = ((totalMin % 1440) + 1440) % 1440 % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ----------------------------------------------------------------------------
// Telefones de teste, todos na faixa combinada "2190000000X" (fácil de achar
// e apagar depois -- ver TESTES.md para o SQL de limpeza). Cada sub-teste usa
// um telefone diferente, pra não misturar resultado de um teste com outro.
// ----------------------------------------------------------------------------
const TEL = {
  nome: "21900000001", // testes de validação de nome
  telefoneFormatado: "21900000002", // teste "telefone formatado deve ser aceito"
  antiSpam: "21900000003", // teste de limite de 3 agendamentos futuros
  conflitoA: "21900000004", // 1ª parte do teste de conflito de horário
  conflitoB: "21900000005", // 2ª parte (tenta roubar o mesmo horário)
  fronteira: "21900000006", // teste da virada/fronteira do expediente
  listaLivres: "21900000007", // teste de listar_horarios_livres antes/depois de agendar
};

const resultados = []; // cada item: { teste, esperado, obtido, passou }
function registrar(teste, esperado, obtido, passou) {
  resultados.push({ teste, esperado, obtido, passou });
  console.log(`${passou ? "✅ PASSOU" : "❌ FALHOU"} — ${teste}`);
  console.log(`   esperado: ${esperado}`);
  console.log(`   obtido:   ${obtido}\n`);
}

// chama criar_agendamento_publico e devolve { id, erro } (nunca lança exceção, pra o script seguir rodando mesmo se um teste falhar)
async function tentarAgendar({ barbeariaId, barbeiroId, servicoId, data, hora, nome, telefone }) {
  const { data: id, error } = await supabase.rpc("criar_agendamento_publico", {
    p_barbearia_id: barbeariaId,
    p_barbeiro_id: barbeiroId,
    p_servico_id: servicoId,
    p_data: data,
    p_hora: hora,
    p_nome_cliente: nome,
    p_telefone_cliente: telefone,
  });
  return { id, erro: error };
}

async function main() {
  console.log("== 1) Confirmando a barbearia de teste pelo slug ==\n");
  const { data: linhasBarbearia, error: erroBarbearia } = await supabase.rpc("buscar_barbearia_publica", { p_slug: "barbearia-teste" });

  if (erroBarbearia || !linhasBarbearia || linhasBarbearia.length === 0) {
    console.error("Não encontrei a barbearia com slug 'barbearia-teste'. Erro:", erroBarbearia);
    console.error("Parando por aqui -- sem barbearia não dá pra testar mais nada.");
    console.log("\n```json\n" + JSON.stringify(resultados, null, 2) + "\n```");
    process.exitCode = 1;
    return;
  }

  const barbearia = linhasBarbearia[0];
  console.log(`Barbearia encontrada: "${barbearia.nome}" (id ${barbearia.id})\n`);

  const { data: barbeiros } = await supabase.rpc("listar_barbeiros_publicos", { p_barbearia_id: barbearia.id });
  const { data: servicos } = await supabase.rpc("listar_servicos_publicos", { p_barbearia_id: barbearia.id });

  if (!barbeiros?.length || !servicos?.length) {
    console.error("Essa barbearia não tem barbeiro ativo e/ou serviço ativo cadastrado. Parando por aqui.");
    console.log("\n```json\n" + JSON.stringify(resultados, null, 2) + "\n```");
    process.exitCode = 1;
    return;
  }

  const barbeiro = barbeiros[0];
  const servico = servicos[0];
  console.log(`Barbeiro escolhido: "${barbeiro.nome}" (id ${barbeiro.id})`);
  console.log(`Serviço escolhido: "${servico.nome}", ${servico.duracao_min} min (id ${servico.id})\n`);

  // --------------------------------------------------------------------------
  // 2) Procura, nos próximos 14 dias a partir de amanhã, o primeiro dia com
  // horário livre pra esse barbeiro+serviço (precisamos de pelo menos 1 dia
  // assim pra testar conflito/anti-spam/fronteira/listar_horarios_livres)
  // --------------------------------------------------------------------------
  console.log("== 2) Procurando um dia com horário livre (a partir de amanhã) ==\n");
  let dataComVagas = null;
  let horariosLivres = [];
  const amanha = somarDias(hojeISO(), 1);

  for (let i = 1; i <= 14; i++) {
    const dataTentativa = somarDias(hojeISO(), i);
    const { data: livres } = await supabase.rpc("listar_horarios_livres", {
      p_barbeiro_id: barbeiro.id,
      p_data: dataTentativa,
      p_servico_id: servico.id,
    });
    if (livres && livres.length > 0) {
      dataComVagas = dataTentativa;
      horariosLivres = livres.map((h) => h.horario.slice(0, 5)); // "08:00:00" -> "08:00"
      break;
    }
  }

  if (!dataComVagas) {
    console.warn(
      `⚠️  Nenhum horário livre encontrado nos próximos 14 dias pro barbeiro "${barbeiro.nome}" com o serviço "${servico.nome}".\n` +
      "   Isso geralmente significa que esse barbeiro não tem horarios_trabalho cadastrado.\n" +
      "   Vou pular os testes que dependem de um horário livre de verdade (anti-spam, conflito,\n" +
      "   fronteira do expediente, listar_horarios_livres) e rodar só os de validação de nome/telefone\n" +
      "   (que falham ANTES de chegar na checagem de expediente, então não dependem disso).\n"
    );
  } else {
    console.log(`Dia com vaga encontrado: ${dataComVagas}, com ${horariosLivres.length} horário(s) livre(s): ${horariosLivres.join(", ")}\n`);
  }

  // horário "qualquer" usado só nos testes que devem falhar ANTES de chegar na checagem de
  // expediente (ex: nome/telefone inválido) -- nesses casos não importa se esse horário é real
  const HORARIO_QUALQUER = "10:00";
  const horarioValido = dataComVagas ? horariosLivres[0] : HORARIO_QUALQUER;
  const dataTeste = dataComVagas ?? amanha;

  // ==========================================================================
  // TESTE 1 — validação de nome
  // ==========================================================================
  console.log("== TESTE 1: validação de nome ==\n");

  {
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "A", telefone: "21900000011",
    });
    registrar(
      "1a) nome com 1 letra",
      "erro mencionando 'Nome precisa ter entre 2 e 100 caracteres'",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.includes("Nome precisa ter entre 2 e 100")
    );
  }

  {
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "      ", telefone: "21900000012",
    });
    registrar(
      "1b) nome só com espaços",
      "erro mencionando 'Nome precisa ter entre 2 e 100 caracteres' (após trim, fica vazio)",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.includes("Nome precisa ter entre 2 e 100")
    );
  }

  {
    const nome101 = "A".repeat(101); // 101 caracteres, 1 a mais que o limite
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: nome101, telefone: "21900000013",
    });
    registrar(
      "1c) nome com 101 caracteres",
      "erro mencionando 'Nome precisa ter entre 2 e 100 caracteres'",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.includes("Nome precisa ter entre 2 e 100")
    );
  }

  if (dataComVagas) {
    // nome propositalmente construído: 99 caracteres "de verdade" + 1 espaço de cada lado = 101 crus.
    // Se o banco NÃO desse trim antes de contar o tamanho, 101 > 100 e devia RECUSAR.
    // Se o banco dá trim antes (como implementamos), o tamanho contado é 99 e devia ACEITAR.
    // Ou seja: um agendamento aceito aqui É A PROVA de que o trim acontece antes da validação.
    const nomeComEspacos = " TESTE CLAUDE " + "A".repeat(85) + " "; // "TESTE CLAUDE " (13) + 85 "A" = 98... ajustado abaixo
    const nomeTrimado = nomeComEspacos.trim();
    const { id, erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: nomeComEspacos, telefone: TEL.nome,
    });
    registrar(
      `1d) nome válido com espaços nas pontas (cru tem ${nomeComEspacos.length} caracteres, sem os espaços tem ${nomeTrimado.length})`,
      "agendamento criado com sucesso (prova que o banco faz trim ANTES de validar o tamanho)",
      erro ? `erro: ${erro.message}` : `sucesso, id do agendamento: ${id}`,
      !erro && !!id
    );
  } else {
    registrar("1d) nome válido com espaços nas pontas", "agendamento criado com sucesso", "PULADO (sem horário livre disponível)", null);
  }

  // ==========================================================================
  // TESTE 2 — validação de telefone
  // ==========================================================================
  console.log("== TESTE 2: validação de telefone ==\n");

  {
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "TESTE CLAUDE Telefone Curto", telefone: "219000021", // 9 dígitos
    });
    registrar(
      "2a) telefone com 9 dígitos",
      "erro mencionando 'Telefone precisa ter 10 ou 11 números'",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.includes("Telefone precisa ter 10 ou 11")
    );
  }

  {
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "TESTE CLAUDE Telefone Longo", telefone: "219000002299", // 12 dígitos
    });
    registrar(
      "2b) telefone com 12 dígitos",
      "erro mencionando 'Telefone precisa ter 10 ou 11 números'",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.includes("Telefone precisa ter 10 ou 11")
    );
  }

  if (dataComVagas) {
    // "(21) 90000-0002" normalizado vira "21900000002" (TEL.telefoneFormatado); se o insert
    // tivesse ido com a formatação, teria violado a constraint "clientes_telefone_formato" (só
    // dígitos) e dado erro -- então sucesso aqui já prova que foi normalizado antes de salvar
    const { id, erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "TESTE CLAUDE Telefone Formatado", telefone: "(21) 90000-0002",
    });
    registrar(
      "2c) telefone formatado '(21) 90000-0002'",
      "agendamento criado com sucesso (prova que foi normalizado pra 21900000002 antes de salvar, senão a constraint do banco teria barrado)",
      erro ? `erro: ${erro.message}` : `sucesso, id do agendamento: ${id}`,
      !erro && !!id
    );
  } else {
    registrar("2c) telefone formatado '(21) 90000-0002'", "agendamento criado com sucesso", "PULADO (sem horário livre disponível)", null);
  }

  // ==========================================================================
  // TESTE EXTRA — comprova o bug do "+55" que a migration 004 (ainda não
  // aplicada no banco) corrige. Não depende de horário livre, porque a
  // validação de telefone acontece ANTES da checagem de expediente.
  // ==========================================================================
  console.log("== TESTE EXTRA: telefone com '+55' (bug que a migration 004 corrige) ==\n");

  {
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioValido, nome: "TESTE CLAUDE Mais55", telefone: "+55 21 90000-0008",
    });
    registrar(
      "EXTRA) telefone '+55 21 90000-0008' (ANTES da migration 004)",
      "comportamento ATUAL (bug): recusado, porque o '55' fica colado (vira 13 dígitos). Depois da migration 004, esperado é ACEITAR.",
      erro ? erro.message : "(nenhum erro -- aceitou; se isso aconteceu, a migration 004 já deve estar aplicada)",
      !!erro && erro.message.includes("Telefone precisa ter 10 ou 11") // comprova o bug enquanto a 004 não roda
    );
  }

  // ==========================================================================
  // TESTE 3 — anti-spam (máx. 3 agendamentos futuros não cancelados por telefone)
  // ==========================================================================
  console.log("== TESTE 3: anti-spam (limite de 3 agendamentos futuros) ==\n");

  if (dataComVagas && horariosLivres.length >= 3) {
    // usa 3 horários livres DIFERENTES nesse mesmo dia, pra não esbarrar na trava de conflito de horário
    for (let i = 0; i < 3; i++) {
      const { id, erro } = await tentarAgendar({
        barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
        data: dataTeste, hora: horariosLivres[i], nome: "TESTE CLAUDE Antispam", telefone: TEL.antiSpam,
      });
      registrar(
        `3.${i + 1}) ${i + 1}º agendamento futuro com o mesmo telefone (${horariosLivres[i]})`,
        "criado com sucesso",
        erro ? `erro: ${erro.message}` : `sucesso, id: ${id}`,
        !erro && !!id
      );
    }

    // o 4º deve ser recusado -- a checagem de spam roda ANTES da checagem de conflito de horário,
    // então nem importa se esse horário já está ocupado ou não
    const { erro } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horariosLivres[0], nome: "TESTE CLAUDE Antispam", telefone: TEL.antiSpam,
    });
    registrar(
      "3.4) 4º agendamento futuro com o mesmo telefone",
      "recusado, mencionando o limite de 3 agendamentos futuros",
      erro ? erro.message : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!erro && erro.message.toLowerCase().includes("3 agendamentos")
    );
  } else {
    registrar(
      "3) anti-spam (3 agendamentos + 1 bloqueado)",
      "3 aceitos, 4º bloqueado",
      `PULADO (precisa de pelo menos 3 horários livres no mesmo dia; achei ${horariosLivres.length})`,
      null
    );
  }

  // ==========================================================================
  // TESTE 4 — conflito de horário (mesmo barbeiro, mesmo horário, 2 clientes diferentes)
  // ==========================================================================
  console.log("== TESTE 4: conflito de horário ==\n");

  if (dataComVagas) {
    const horarioConflito = horariosLivres[horariosLivres.length - 1]; // usa o último livre, bem longe dos horários já ocupados pelo teste 3
    const primeira = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioConflito, nome: "TESTE CLAUDE Conflito A", telefone: TEL.conflitoA,
    });
    registrar(
      "4a) 1º agendamento nesse horário",
      "criado com sucesso",
      primeira.erro ? `erro: ${primeira.erro.message}` : `sucesso, id: ${primeira.id}`,
      !primeira.erro && !!primeira.id
    );

    const segunda = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioConflito, nome: "TESTE CLAUDE Conflito B", telefone: TEL.conflitoB,
    });
    registrar(
      "4b) 2º agendamento no MESMO horário e barbeiro (deve colidir)",
      "recusado com o código 23P01 (trava 'sem_conflito_de_horario' do banco), tratado pelo site como 'horário acabou de ser ocupado'",
      segunda.erro ? `erro: ${segunda.erro.message} (código: ${segunda.erro.code})` : "(nenhum erro -- NÃO deveria ter aceitado)",
      !!segunda.erro && segunda.erro.code === "23P01"
    );
  } else {
    registrar("4) conflito de horário", "2º agendamento recusado (23P01)", "PULADO (sem horário livre disponível)", null);
  }

  // ==========================================================================
  // TESTE 5 — fronteira do expediente (o próximo slot de 15min após o último
  // horário livre não deveria caber, por causa da duração do serviço)
  // ==========================================================================
  console.log("== TESTE 5: fronteira do expediente (checagem que a migration 003 corrigiu) ==\n");

  if (dataComVagas) {
    const ultimoLivre = horariosLivres[horariosLivres.length - 1];
    const horarioQueNaoCabe = somarMinutos(ultimoLivre, 15); // 1 slot de 15min depois do último que listar_horarios_livres considerou válido
    const { erro, id } = await tentarAgendar({
      barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
      data: dataTeste, hora: horarioQueNaoCabe, nome: "TESTE CLAUDE Fronteira", telefone: TEL.fronteira,
    });
    registrar(
      `5) horário ${horarioQueNaoCabe} (15min depois do último horário livre, ${ultimoLivre}) com serviço de ${servico.duracao_min}min`,
      "recusado, mencionando 'Horário fora do expediente do barbeiro'",
      erro ? erro.message : `(nenhum erro -- aceitou, id ${id}; pode ser que ainda coubesse no expediente)`,
      !!erro && erro.message.includes("fora do expediente")
    );
  } else {
    registrar("5) fronteira do expediente", "horário logo após o expediente é recusado", "PULADO (sem horário livre disponível)", null);
  }

  // ==========================================================================
  // TESTE 6 — listar_horarios_livres reflete os agendamentos já feitos
  // ==========================================================================
  console.log("== TESTE 6: listar_horarios_livres some com o horário ocupado ==\n");

  if (dataComVagas) {
    const { data: livresAntes } = await supabase.rpc("listar_horarios_livres", {
      p_barbeiro_id: barbeiro.id, p_data: dataTeste, p_servico_id: servico.id,
    });
    const listaAntes = (livresAntes ?? []).map((h) => h.horario.slice(0, 5));

    const candidato = listaAntes[0]; // pega o primeiro horário AINDA livre nesse momento (depois dos testes 3/4/5 acima)
    if (candidato) {
      await tentarAgendar({
        barbeariaId: barbearia.id, barbeiroId: barbeiro.id, servicoId: servico.id,
        data: dataTeste, hora: candidato, nome: "TESTE CLAUDE Lista Livres", telefone: TEL.listaLivres,
      });

      const { data: livresDepois } = await supabase.rpc("listar_horarios_livres", {
        p_barbeiro_id: barbeiro.id, p_data: dataTeste, p_servico_id: servico.id,
      });
      const listaDepois = (livresDepois ?? []).map((h) => h.horario.slice(0, 5));

      registrar(
        `6) horário ${candidato} some da lista depois de agendado`,
        `'${candidato}' deixa de aparecer em listar_horarios_livres`,
        listaDepois.includes(candidato) ? `ainda aparece na lista: [${listaDepois.join(", ")}]` : `não aparece mais (lista agora: [${listaDepois.join(", ") || "vazia"}])`,
        !listaDepois.includes(candidato)
      );
    } else {
      registrar("6) listar_horarios_livres reflete agendamento", "horário some da lista", "PULADO (não sobrou nenhum horário livre após os testes anteriores)", null);
    }
  } else {
    registrar("6) listar_horarios_livres reflete agendamento", "horário some da lista", "PULADO (sem horário livre disponível)", null);
  }

  // --------------------------------------------------------------------------
  console.log("\n\n========== RESUMO (copiar pra TESTES.md) ==========\n");
  console.log(JSON.stringify(resultados, null, 2));
}

main().catch((erro) => {
  console.error("Erro inesperado rodando o script:", erro);
  process.exitCode = 1;
});
