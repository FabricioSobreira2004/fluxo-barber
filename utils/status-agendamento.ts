import { type VarianteBadge } from "@/components/ui/Badge"; // cores disponíveis pro Badge
import { type TipoEnum } from "@/utils/supabase/database.types"; // tipo gerado a partir do enum "status_agendamento" do banco

// vem direto do enum do banco (ver supabase/migrations/001_schema_inicial.sql); se mudar lá e você rodar
// "supabase gen types" de novo, o TypeScript avisa aqui automaticamente onde precisa ajustar
export type StatusAgendamento = TipoEnum<"status_agendamento">;

interface ConfigStatus { // tudo que a interface precisa saber sobre um status, num só lugar
  rotulo: string; // texto mostrado no Badge
  variante: VarianteBadge; // cor do Badge
  corFaixa: string; // classe Tailwind de fundo, usada na faixa lateral colorida do card de agendamento
  opacidadeCard?: string; // classe Tailwind opcional, pra deixar o card "discreto" (estados finais, de dias passados)
  riscado?: boolean; // true só pro cancelado: risca o nome do cliente e o serviço, reforçando visualmente "não aconteceu"
}

export const CONFIG_STATUS: Record<StatusAgendamento, ConfigStatus> = { // como mostrar cada status na tela
  // "agendado" e "confirmado" aparecem EXATAMENTE iguais (mesmo rótulo, mesma cor): na prática a barbearia
  // não confirma manualmente, então os dois significam a mesma coisa pro dono — "confirmado" continua
  // existindo no banco só pro futuro lembrete por WhatsApp, em que o próprio cliente confirma (ver BotoesStatus.tsx)
  agendado: { rotulo: "Agendado", variante: "dourado", corFaixa: "bg-dourado" }, // futuro, precisa de atenção: cor cheia
  confirmado: { rotulo: "Agendado", variante: "dourado", corFaixa: "bg-dourado" },
  // concluído: verde DISCRETO (faixa com metade da opacidade + card levemente apagado) — é um estado final positivo, não precisa chamar atenção
  concluido: { rotulo: "Concluído", variante: "sucesso", corFaixa: "bg-sucesso/50", opacidadeCard: "opacity-80" },
  // cancelado: vermelho discreto + riscado — "não aconteceu", por isso o visual mais apagado de todos
  cancelado: { rotulo: "Cancelado", variante: "erro", corFaixa: "bg-erro/50", opacidadeCard: "opacity-50", riscado: true },
  // faltou: vermelho discreto (mesma cor do cancelado — o rótulo do Badge já diferencia os dois)
  faltou: { rotulo: "Faltou", variante: "erro", corFaixa: "bg-erro/50", opacidadeCard: "opacity-80" },
};
