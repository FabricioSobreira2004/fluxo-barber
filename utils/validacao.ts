import { telefoneTemFormatoValido } from "@/utils/telefone"; // mesma regra de formato usada aqui e no banco (migration 003)

// mesmas regras e mensagens da migration 003 (funções públicas do banco), repetidas aqui pro
// formulário avisar o erro ANTES de gastar uma chamada de rede — o banco sempre valida de novo,
// então essa validação no navegador é só uma conveniência, nunca a única linha de defesa
export function validarNomeCliente(nome: string): string | null { // devolve a mensagem de erro, ou null se estiver válido
  const limpo = nome.trim();
  if (limpo.length < 2 || limpo.length > 100) {
    return "Nome precisa ter entre 2 e 100 caracteres.";
  }
  return null;
}

export function validarTelefoneCliente(telefone: string): string | null { // devolve a mensagem de erro, ou null se estiver válido
  if (!telefoneTemFormatoValido(telefone)) {
    return "Telefone precisa ter 10 ou 11 números (DDD + número).";
  }
  return null;
}
