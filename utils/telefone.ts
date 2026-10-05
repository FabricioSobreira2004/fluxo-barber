export function normalizarTelefone(bruto: string): string { // remove tudo que não é número (espaços, parênteses, hífen, "+55"...)
  return bruto.replace(/\D/g, ""); // mesma regra usada no banco (migration 003), pra nunca salvar dois formatos diferentes do mesmo telefone
}

export function telefoneTemFormatoValido(bruto: string): boolean { // mesma regra da constraint "clientes_telefone_formato" do banco
  const digitos = normalizarTelefone(bruto);
  return /^[0-9]{10,11}$/.test(digitos); // 10 dígitos (fixo) ou 11 dígitos (celular com o "9" na frente), só números
}

export function formatarTelefone(bruto: string): string { // ex: "21990163583" -> "(21) 99016-3583"
  const digitos = normalizarTelefone(bruto);

  if (digitos.length === 11) { // celular com 9 dígitos: (DD) 9XXXX-XXXX
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) { // telefone fixo ou celular antigo, 8 dígitos: (DD) XXXX-XXXX
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return bruto; // formato que não reconhecemos: devolve como foi digitado, sem arriscar exibir algo quebrado
}

export function aplicarMascaraTelefone(valor: string): string { // usada no onChange do campo, pra formatar enquanto a pessoa digita
  const digitos = normalizarTelefone(valor).slice(0, 11); // no máximo 11 dígitos, mesmo se colar um texto maior

  if (digitos.length === 0) return ""; // campo vazio continua vazio (sem mostrar "()" sozinho)

  const ddd = digitos.slice(0, 2);
  const restante = digitos.slice(2);

  if (digitos.length <= 2) return `(${ddd}`; // ainda digitando o DDD

  if (restante.length <= 4) return `(${ddd}) ${restante}`; // começo do número, antes de ter o suficiente pra separar com hífen

  // o 9º dígito do celular só aparece quando o número final vai ter 11 dígitos; até lá, assume o agrupamento de telefone fixo (4+4)
  const tamanhoPrimeiroBloco = restante.length >= 9 ? 5 : 4;
  const primeiroBloco = restante.slice(0, tamanhoPrimeiroBloco);
  const segundoBloco = restante.slice(tamanhoPrimeiroBloco);

  return `(${ddd}) ${primeiroBloco}${segundoBloco ? `-${segundoBloco}` : ""}`;
}

export function linkWhatsapp(bruto: string): string { // monta o link "wa.me" pra abrir uma conversa direto com esse número
  const digitos = normalizarTelefone(bruto);
  return `https://wa.me/55${digitos}`; // "55" é o código do Brasil; o telefone é sempre cadastrado sem ele
}
