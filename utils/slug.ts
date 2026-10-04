// faixa unicode dos "acentos combináveis" (ex: o acento agudo separado da letra "e" depois do normalize("NFD"));
// construída por código numérico (em vez de "̀" escrito direto) pra evitar o caractere literal solto no arquivo
const INICIO_ACENTOS = String.fromCharCode(0x0300);
const FIM_ACENTOS = String.fromCharCode(0x036f);
const REGEX_ACENTOS = new RegExp(`[${INICIO_ACENTOS}-${FIM_ACENTOS}]`, "g");

// transforma um nome em "slug" (a parte da URL), ex: "Barbearia do Zé" -> "barbearia-do-ze"
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD") // separa letras de seus acentos (ex: "é" vira "e" + um acento "solto")
    .replace(REGEX_ACENTOS, "") // remove os acentos já separados pelo passo anterior
    .toLowerCase() // slug é sempre minúsculo, por convenção de URL
    .trim() // remove espaços no início/fim
    .replace(/[^a-z0-9\s-]/g, "") // remove qualquer caractere que não seja letra, número, espaço ou hífen
    .replace(/[\s_]+/g, "-") // troca espaços (e underscores) por hífen
    .replace(/-+/g, "-") // colapsa hífens repetidos em um só (ex: "a--b" -> "a-b")
    .replace(/^-|-$/g, ""); // remove hífen sobrando bem no início ou no fim
}
