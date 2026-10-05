"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que a Agenda precisa buscar dados de novo depois disso
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { barbeariaProntaParaAgendamentos } from "@/utils/supabase/prontidao"; // confere o resultado final com a MESMA regra usada no resto do site

// formato de cada barbeiro/serviço/horário que o assistente (Client Component) manda pra cá —
// tudo em memória no navegador até este ponto; só grava no banco quando o dono clica "Concluir"
export interface BarbeiroRapido {
  nome: string;
}

export interface ServicoRapido {
  nome: string;
  duracaoMin: number;
  precoCentavos: number;
}

export interface HorarioRapido {
  diasSemana: number[]; // 0 (domingo) a 6 (sábado) -- mesmo padrão de horarios_trabalho.dia_semana
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
}

export interface ResultadoConfiguracaoRapida {
  pronta: boolean; // true quando, depois de salvar tudo, o link já atende aos 3 requisitos
  erro?: string;
}

// salva de uma vez só tudo que foi preenchido no assistente de configuração rápida. Linhas em
// branco (sem nome, ou serviço sem preço) são simplesmente ignoradas -- é assim que uma etapa
// "vazia" (o dono não quis preencher aquele passo) se comporta igual a ter pulado ele
export async function concluirConfiguracaoRapida(
  barbeirosRapidos: BarbeiroRapido[],
  servicosRapidos: ServicoRapido[],
  horarioRapido: HorarioRapido | null
): Promise<ResultadoConfiguracaoRapida> {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia gravar

  const nomesBarbeiros = barbeirosRapidos.map((b) => b.nome.trim()).filter(Boolean); // só os nomes que não ficaram vazios

  let idsBarbeirosCriados: string[] = [];
  if (nomesBarbeiros.length > 0) {
    const { data, error } = await supabase
      .from("barbeiros")
      .insert(nomesBarbeiros.map((nome) => ({ barbearia_id: barbeariaId, nome })))
      .select("id");

    if (error) return { pronta: false, erro: "Não foi possível salvar os barbeiros. Tente novamente." };
    idsBarbeirosCriados = (data ?? []).map((linha) => linha.id);
  }

  // um serviço só "conta" se tiver nome E preço preenchido (duração sempre tem um valor sugerido,
  // então não precisa ser validada aqui) -- preço é obrigatório de propósito: o dono digita o
  // valor de verdade, o sistema nunca inventa um preço
  const servicosValidos = servicosRapidos.filter((s) => s.nome.trim() && s.precoCentavos > 0);
  if (servicosValidos.length > 0) {
    const { error } = await supabase.from("servicos").insert(
      servicosValidos.map((s) => ({
        barbearia_id: barbeariaId,
        nome: s.nome.trim(),
        duracao_min: s.duracaoMin,
        preco_centavos: s.precoCentavos,
      }))
    );

    if (error) return { pronta: false, erro: "Não foi possível salvar os serviços. Tente novamente." };
  }

  // o horário só é aplicado se existirem barbeiros criados (sem isso, não tem a quem ligar o
  // horário) e pelo menos 1 dia da semana marcado
  if (horarioRapido && idsBarbeirosCriados.length > 0 && horarioRapido.diasSemana.length > 0) {
    const linhasHorario = idsBarbeirosCriados.flatMap((barbeiroId) => // 1 linha por barbeiro, por dia marcado -- o mesmo horário padrão pra todo mundo
      horarioRapido.diasSemana.map((diaSemana) => ({
        barbearia_id: barbeariaId,
        barbeiro_id: barbeiroId,
        dia_semana: diaSemana,
        inicio: horarioRapido.inicio,
        fim: horarioRapido.fim,
      }))
    );

    const { error } = await supabase.from("horarios_trabalho").insert(linhasHorario);
    if (error) return { pronta: false, erro: "Não foi possível salvar os horários. Tente novamente." };
  }

  revalidatePath("/painel/agenda"); // a Agenda (card "Seu link", checklist) precisa refletir os dados novos na próxima visita
  revalidatePath("/painel/configuracoes");

  const status = await barbeariaProntaParaAgendamentos(supabase, barbeariaId); // confere de verdade, com a mesma regra do resto do site -- nunca afirma "pronto" sem checar
  return { pronta: status.pronta };
}
