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

export function inicioDoDiaBrasil(dataISO: string): string { // "AAAA-MM-DD" -> timestamp do início (00:00) desse dia, já no fuso de Brasília
  return `${dataISO}T00:00:00-03:00`;
}

export function limitesDoDia(dataISO: string): { inicio: string; fim: string } { // intervalo [inicio, fim) do dia, em horário de Brasília
  return {
    inicio: inicioDoDiaBrasil(dataISO),
    fim: inicioDoDiaBrasil(somarDias(dataISO, 1)),
  };
}

export function primeiroDiaDoMes(dataISO: string): string { // ex: "2026-10-17" -> "2026-10-01"
  const [ano, mes] = dataISO.split("-").map(Number);
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

export function somarMeses(dataISO: string, quantidade: number): string { // ex: somarMeses("2026-10-01", -1) -> "2026-09-01"
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, dia)); // Date.UTC normaliza sozinho meses fora de 1-12 (ex: mês "-1" vira dezembro do ano anterior)
  return data.toISOString().slice(0, 10);
}

export function diferencaDias(inicioISO: string, fimISO: string): number { // quantos dias existem entre as 2 datas (fimISO - inicioISO)
  const [a1, m1, d1] = inicioISO.split("-").map(Number);
  const [a2, m2, d2] = fimISO.split("-").map(Number);
  const diferencaMs = Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1); // UTC dos dois lados: sem risco de horário de verão de outros países
  return Math.round(diferencaMs / 86_400_000); // 86.400.000ms = 1 dia
}

export function dataLocalBrasil(timestamptz: string): string { // "2026-10-04T12:00:00+00:00" -> "2026-10-04" (data no fuso de Brasília)
  return new Date(timestamptz).toLocaleDateString("sv-SE", { timeZone: FUSO_BRASIL }); // locale sueco: mesmo truque de hojeISO()
}

export function horaLocalBrasil(timestamptz: string): number { // "2026-10-04T12:00:00+00:00" -> 9 (hora cheia, 0 a 23, já no fuso de Brasília)
  // "hourCycle: h23" (em vez de "hour12: false") garante a faixa 00-23 certa: em algumas implementações,
  // "hour12: false" sozinho devolve "24" pra meia-noite, em vez de "00"
  const horaTexto = new Date(timestamptz).toLocaleString("en-US", { timeZone: FUSO_BRASIL, hour: "2-digit", hourCycle: "h23" });
  return Number(horaTexto);
}

export function paraTimestampBrasil(dataISO: string, horaISO: string): string { // junta "AAAA-MM-DD" + "HH:MM" num timestamp com fuso explícito
  return `${dataISO}T${horaISO}:00-03:00`;
}

export function diaDaSemana(dataISO: string): number { // "2026-10-04" -> 0 (domingo) a 6 (sábado), mesmo padrão de horarios_trabalho.dia_semana
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 12)).getUTCDay(); // meio-dia UTC: o dia da semana não muda em nenhum fuso horário razoável
}

export function duracaoEmMinutos(inicioTz: string, fimTz: string): number { // diferença entre dois timestamps, em minutos inteiros
  const diferencaMs = new Date(fimTz).getTime() - new Date(inicioTz).getTime(); // diferença em milissegundos
  return Math.round(diferencaMs / 60000); // 60000ms = 1 minuto
}

export function formatarHora(timestamptz: string): string { // ex: "2026-10-04T11:00:00+00:00" -> "08:00" (já convertido pro fuso de Brasília)
  return new Date(timestamptz).toLocaleTimeString("pt-BR", { timeZone: FUSO_BRASIL, hour: "2-digit", minute: "2-digit" });
}

export function formatarDataLonga(dataISO: string): string { // ex: "2026-10-04" -> "Domingo, 4 de outubro de 2026"
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12)); // meio-dia UTC: evita cair no dia errado por causa do fuso horário
  const textoPorExtenso = data.toLocaleDateString("pt-BR", { // o pt-BR do navegador devolve tudo em minúsculas, ex: "domingo, 4 de outubro de 2026"
    timeZone: FUSO_BRASIL,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // deixa maiúscula só a primeira letra (padrão do português), em vez de usar CSS "capitalize"
  // (que deixaria TODA palavra maiúscula, incluindo "De Outubro De" — errado em português)
  return textoPorExtenso.charAt(0).toUpperCase() + textoPorExtenso.slice(1);
}
