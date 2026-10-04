// o Fluxo Barber é um produto só pro Brasil, então fixamos o fuso de Brasília;
// como o Brasil não usa mais horário de verão desde 2019, um offset fixo "-03:00" é seguro aqui
// (evita precisar de uma biblioteca de fuso horário só pra isso)
const FUSO_BRASIL = "America/Sao_Paulo";

export function hojeISO(): string { // data de hoje no fuso do Brasil, no formato "AAAA-MM-DD"
  return new Date().toLocaleDateString("sv-SE", { timeZone: FUSO_BRASIL }); // o locale sueco formata datas como AAAA-MM-DD
}

export function somarDias(dataISO: string, quantidade: number): string { // ex: somarDias("2026-10-04", 1) -> "2026-10-05"
  const [ano, mes, dia] = dataISO.split("-").map(Number); // separa "AAAA-MM-DD" nos 3 números
  const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade)); // usa UTC pra somar dias sem risco de horário de verão de outros países
  return data.toISOString().slice(0, 10); // volta pro formato "AAAA-MM-DD"
}

export function limitesDoDia(dataISO: string): { inicio: string; fim: string } { // intervalo [inicio, fim) do dia, em horário de Brasília
  return {
    inicio: `${dataISO}T00:00:00-03:00`,
    fim: `${somarDias(dataISO, 1)}T00:00:00-03:00`,
  };
}

export function paraTimestampBrasil(dataISO: string, horaISO: string): string { // junta "AAAA-MM-DD" + "HH:MM" num timestamp com fuso explícito
  return `${dataISO}T${horaISO}:00-03:00`;
}

export function formatarHora(timestamptz: string): string { // ex: "2026-10-04T11:00:00+00:00" -> "08:00" (já convertido pro fuso de Brasília)
  return new Date(timestamptz).toLocaleTimeString("pt-BR", { timeZone: FUSO_BRASIL, hour: "2-digit", minute: "2-digit" });
}

export function formatarDataLonga(dataISO: string): string { // ex: "2026-10-04" -> "sábado, 4 de outubro de 2026"
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12)); // meio-dia UTC: evita cair no dia errado por causa do fuso horário
  return data.toLocaleDateString("pt-BR", { timeZone: FUSO_BRASIL, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
