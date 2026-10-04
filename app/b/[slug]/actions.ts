"use server"; // este arquivo roda só no servidor; aqui NÃO exigimos login, é a página pública de agendamento

import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor (só a chave pública, nunca a secret)

export async function buscarHorariosLivres(barbeiroId: string, data: string, servicoId: string): Promise<string[]> { // chamada direto pelo componente, sem formulário
  const supabase = await createClient(); // conexão com o Supabase (funciona mesmo sem usuário logado)

  const { data: horarios } = await supabase.rpc("listar_horarios_livres", { // função do banco criada em supabase/migrations/002_agendamento_publico.sql
    p_barbeiro_id: barbeiroId,
    p_data: data,
    p_servico_id: servicoId,
  });

  return ((horarios ?? []) as { horario: string }[]).map((h) => h.horario.slice(0, 5)); // "08:00:00" -> "08:00"
}

interface DadosNovoAgendamentoPublico { // tudo que a página precisa mandar pra criar o agendamento
  barbeariaId: string;
  barbeiroId: string;
  servicoId: string;
  data: string;
  hora: string;
  nome: string;
  telefone: string;
}

export interface EstadoAgendamentoPublico { // formato do resultado devolvido pro componente
  erro?: string;
}

export async function criarAgendamentoPublico(dados: DadosNovoAgendamentoPublico): Promise<EstadoAgendamentoPublico> {
  const supabase = await createClient(); // conexão com o Supabase (funciona mesmo sem usuário logado)

  const { error } = await supabase.rpc("criar_agendamento_publico", { // função do banco faz toda a validação e o insert
    p_barbearia_id: dados.barbeariaId,
    p_barbeiro_id: dados.barbeiroId,
    p_servico_id: dados.servicoId,
    p_data: dados.data,
    p_hora: dados.hora,
    p_nome_cliente: dados.nome,
    p_telefone_cliente: dados.telefone,
  });

  if (error) {
    if (error.code === "23P01") { // violação da trava "sem_conflito_de_horario": alguém agendou esse horário um instante antes
      return { erro: "Esse horário acabou de ser ocupado por outra pessoa. Escolha outro horário." };
    }
    return { erro: "Não foi possível criar o agendamento. Tente novamente." };
  }

  return {};
}
