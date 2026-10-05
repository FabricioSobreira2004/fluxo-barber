import { type VarianteBadge } from "@/components/ui/Badge"; // cores disponíveis pro Badge
import { type TipoEnum } from "@/utils/supabase/database.types"; // tipo gerado a partir do enum "status_agendamento" do banco

// vem direto do enum do banco (ver supabase/migrations/001_schema_inicial.sql); se mudar lá e você rodar
// "supabase gen types" de novo, o TypeScript avisa aqui automaticamente onde precisa ajustar
export type StatusAgendamento = TipoEnum<"status_agendamento">;

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
