// o banco guarda preço em centavos (inteiro), pra nunca ter erro de arredondamento com número decimal;
// essas duas funções convertem entre o que o usuário digita/vê (reais) e o que o banco guarda (centavos)

export function centavosParaReais(centavos: number): string { // formata centavos pra exibir, ex: 2590 -> "25,90"
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function reaisParaCentavos(texto: string): number | null { // converte o que foi digitado (ex: "25,90") em centavos (2590); null se inválido
  const normalizado = texto.trim().replace(",", "."); // aceita vírgula como separador decimal (padrão brasileiro)
  const valor = Number(normalizado);

  if (!Number.isFinite(valor) || valor < 0) { // não é um número válido, ou é negativo
    return null;
  }

  return Math.round(valor * 100); // Math.round evita sobras de ponto flutuante (ex: 25.1 * 100 = 2509.999...)
}
