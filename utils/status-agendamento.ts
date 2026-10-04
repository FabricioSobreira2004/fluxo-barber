import { type VarianteBadge } from "@/components/ui/Badge"; // cores disponíveis pro Badge

// mesmos valores do enum "status_agendamento" criado no banco (ver supabase/migrations/001_schema_inicial.sql);
// se um dia mudar lá, precisa mudar aqui também
export type StatusAgendamento = "agendado" | "confirmado" | "concluido" | "cancelado" | "faltou";

interface ConfigStatus { // tudo que a interface precisa saber sobre um status, num só lugar
  rotulo: string; // texto mostrado no Badge
  variante: VarianteBadge; // cor do Badge
  corFaixa: string; // classe Tailwind de fundo, usada na faixa lateral colorida do card de agendamento
}

export const CONFIG_STATUS: Record<StatusAgendamento, ConfigStatus> = { // como mostrar cada status na tela
  agendado: { rotulo: "Agendado", variante: "dourado", corFaixa: "bg-dourado" },
  confirmado: { rotulo: "Confirmado", variante: "sucesso", corFaixa: "bg-sucesso" },
  concluido: { rotulo: "Concluído", variante: "info", corFaixa: "bg-slate-400" },
  cancelado: { rotulo: "Cancelado", variante: "erro", corFaixa: "bg-erro" },
  faltou: { rotulo: "Faltou", variante: "aviso", corFaixa: "bg-aviso" },
};
