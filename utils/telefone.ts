function somenteDigitos(bruto: string): string { // remove tudo que não é número (espaços, parênteses, hífen, "+55"...)
  return bruto.replace(/\D/g, "");
}

export function formatarTelefone(bruto: string): string { // ex: "21990163583" -> "(21) 99016-3583"
  const digitos = somenteDigitos(bruto);

  if (digitos.length === 11) { // celular com 9 dígitos: (DD) 9XXXX-XXXX
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) { // telefone fixo ou celular antigo, 8 dígitos: (DD) XXXX-XXXX
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return bruto; // formato que não reconhecemos: devolve como foi digitado, sem arriscar exibir algo quebrado
}

export function linkWhatsapp(bruto: string): string { // monta o link "wa.me" pra abrir uma conversa direto com esse número
  const digitos = somenteDigitos(bruto);
  return `https://wa.me/55${digitos}`; // "55" é o código do Brasil; o telefone é sempre cadastrado sem ele
}
