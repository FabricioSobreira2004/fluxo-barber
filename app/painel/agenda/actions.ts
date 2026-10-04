"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que a agenda precisa ser buscada de novo
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { paraTimestampBrasil, diaDaSemana } from "@/utils/data"; // monta o timestamp de início e descobre o dia da semana, a partir de data + hora digitadas
import { type StatusAgendamento } from "@/utils/status-agendamento"; // os status possíveis de um agendamento

export interface EstadoAgenda { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

export async function criarAgendamento(_estadoAnterior: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> { // Server Action do formulário "novo agendamento"
  const barbeiroId = String(formData.get("barbeiro") ?? ""); // qual barbeiro vai atender
  const servicoId = String(formData.get("servico") ?? ""); // qual serviço foi escolhido
  const data = String(formData.get("data") ?? ""); // data do atendimento, "AAAA-MM-DD"
  const hora = String(formData.get("hora") ?? ""); // hora do atendimento, "HH:MM"
  const nomeCliente = String(formData.get("nomeCliente") ?? "").trim(); // nome do cliente (só usado se for um cliente novo)
  const telefoneCliente = String(formData.get("telefoneCliente") ?? "").trim(); // telefone do cliente (identifica se já existe)
  const observacao = String(formData.get("observacao") ?? "").trim(); // anotação livre, opcional

  if (!barbeiroId || !servicoId || !data || !hora || !telefoneCliente) { // validações simples antes de gastar chamadas de rede
    return { erro: "Preencha barbeiro, serviço, data, hora e telefone do cliente." };
  }

  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia cadastrar

  const { data: servico, error: erroServico } = await supabase // busca duração e preço do serviço escolhido
    .from("servicos")
    .select("duracao_min, preco_centavos")
    .eq("id", servicoId)
    .single();

  if (erroServico || !servico) {
    return { erro: "Serviço não encontrado." };
  }

  const { data: clienteExistente } = await supabase // tenta achar um cliente já cadastrado com esse telefone
    .from("clientes")
    .select("id")
    .eq("barbearia_id", barbeariaId)
    .eq("telefone", telefoneCliente)
    .maybeSingle();

  let clienteId = clienteExistente?.id; // reaproveita o cliente existente, se achou

  if (!clienteId) { // telefone novo: precisa cadastrar o cliente agora
    if (!nomeCliente) {
      return { erro: "Esse telefone ainda não tem cadastro. Informe o nome do cliente." };
    }

    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert({ barbearia_id: barbeariaId, nome: nomeCliente, telefone: telefoneCliente })
      .select("id")
      .single();

    if (erroCliente || !novoCliente) {
      return { erro: "Não foi possível cadastrar o cliente." };
    }
    clienteId = novoCliente.id;
  }

  const inicio = paraTimestampBrasil(data, hora); // timestamp de início, já no fuso de Brasília
  const fimDate = new Date(inicio); // usado só pra calcular o horário de término
  fimDate.setMinutes(fimDate.getMinutes() + servico.duracao_min); // fim = início + duração do serviço

  const { error: erroAgendamento } = await supabase.from("agendamentos").insert({
    barbearia_id: barbeariaId,
    barbeiro_id: barbeiroId,
    cliente_id: clienteId,
    servico_id: servicoId,
    inicio,
    fim: fimDate.toISOString(),
    preco_centavos: servico.preco_centavos, // copia o preço do serviço agora; se o preço mudar depois, o histórico não muda
    observacao: observacao || null,
  });

  if (erroAgendamento) {
    if (erroAgendamento.code === "23P01") { // violação da trava "sem_conflito_de_horario" do banco (ver migration)
      return { erro: "Esse barbeiro já tem um atendimento nesse horário." };
    }
    return { erro: "Não foi possível criar o agendamento. Tente novamente." };
  }

  revalidatePath("/painel/agenda"); // faz a lista da página recarregar com o novo agendamento
  return {};
}

export async function mudarStatusAgendamento(id: string, novoStatus: StatusAgendamento) { // chamado direto pelos botões de ação de cada linha
  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado (a policy do banco cuida do resto)

  await supabase.from("agendamentos").update({ status: novoStatus }).eq("id", id);

  revalidatePath("/painel/agenda"); // atualiza a lista pra mostrar o novo status
}

// chamada direto pelo formulário (fora de um <form>, via useEffect) sempre que barbeiro/data/hora mudam,
// só pra avisar o dono se o horário escolhido não bate com o expediente cadastrado -- NÃO bloqueia o agendamento,
// porque o dono pode querer encaixar um cliente fora do horário normal
export async function verificarExpediente(barbeiroId: string, data: string, hora: string): Promise<boolean> {
  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado

  const horaComSegundos = `${hora}:00`; // "08:00" -> "08:00:00", pra comparar no mesmo formato que o banco guarda (coluna "time")

  const { data: intervalos } = await supabase // todos os intervalos de trabalho desse barbeiro, nesse dia da semana
    .from("horarios_trabalho")
    .select("inicio, fim")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaDaSemana(data));

  // comparação de texto funciona aqui porque o formato "HH:MM:SS" sempre tem 2 dígitos em cada parte
  return (intervalos ?? []).some((intervalo) => horaComSegundos >= intervalo.inicio && horaComSegundos < intervalo.fim);
}
