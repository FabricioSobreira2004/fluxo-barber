import { headers } from "next/headers"; // função do Next.js que lê os cabeçalhos da requisição atual

// descobre a URL base do site (ex: "https://fluxo-barber.vercel.app" ou "http://localhost:3000")
// a partir dos cabeçalhos da própria requisição — nunca escrita na mão no código, pra funcionar
// certo tanto no site publicado quanto no localhost, sem precisar trocar nada na mão
export async function obterOrigemSite(): Promise<string> {
  const cabecalhos = await headers(); // cabeçalhos HTTP da requisição atual
  const host = cabecalhos.get("host") ?? "localhost:3000"; // endereço:porta que o navegador usou pra acessar o site
  const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"; // localhost não tem https
  return cabecalhos.get("origin") ?? `${protocolo}://${host}`; // usa o cabeçalho "origin" quando existe; senão monta na mão
}
