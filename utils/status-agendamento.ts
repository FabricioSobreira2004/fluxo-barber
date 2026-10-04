import { type VarianteBadge } from "@/components/ui/Badge"; // cores disponíveis pro Badge

// mesmos valores do enum "status_agendamento" criado no banco (ver supabase/migrations/001_schema_inicial.sql);
// se um dia mudar lá, precisa mudar aqui também
export type StatusAgendamento = "agendado" | "confirmado" | "concluido" | "cancelado" | "faltou";

export const CONFIG_STATUS: Record<StatusAgendamento, { rotulo: string; variante: VarianteBadge }> = { // como mostrar cada status na tela
  agendado: { rotulo: "Agendado", variante: "neutro" },
  confirmado: { rotulo: "Confirmado", variante: "sucesso" },
  concluido: { rotulo: "Concluído", variante: "sucesso" },
  cancelado: { rotulo: "Cancelado", variante: "erro" },
  faltou: { rotulo: "Faltou", variante: "aviso" },
};
