// tenta sugerir um nome pra preencher o atalho "Eu mesmo atendo", na configuração rápida do
// onboarding. Hoje o cadastro só pede email e senha (nenhuma tela pede o nome da pessoa), então
// não existe um "nome do usuário" de verdade guardado em lugar nenhum -- por isso a sugestão vem
// da parte antes do "@" do email, só como ponto de partida; o campo continua editável no
// formulário, então uma sugestão imperfeita não atrapalha, só economiza alguns toques de tecla
export function sugerirNomeUsuario(email: string | null | undefined): string {
  if (!email) return ""; // sem email (não deveria acontecer, usuário sempre logado aqui): sem sugestão nenhuma

  const parteLocal = email.split("@")[0] ?? ""; // "joao.silva@gmail.com" -> "joao.silva"

  return parteLocal
    .split(/[._\-+0-9]+/) // separa em "palavras" nos separadores comuns de email (ponto, underline, hífen, "+") e em sequências de números
    .filter(Boolean) // remove pedaços vazios (ex: separador no início/fim, ou dois separadores seguidos)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()) // "joao" -> "Joao", "SILVA" -> "Silva"
    .join(" "); // "Joao Silva"
}
