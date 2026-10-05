import Link from "next/link"; // navegação interna (Termos/Privacidade) sem recarregar a página

export function Footer() { // rodapé compartilhado: landing, login/cadastro, termos, privacidade e a página pública /b/[slug]
  const ano = new Date().getFullYear(); // calculado a cada carregamento, pra nunca ficar com um ano antigo "preso" no código

  return (
    <footer className="border-t border-borda px-6 py-6 text-center text-sm text-texto-secundario">
      <p>
        © {ano} Fluxo Barber {/* ano sempre atual */}
        {" · "}
        <Link href="/termos" className="hover:text-texto">Termos de Uso</Link> {/* link pra ler as regras de uso do site */}
        {" · "}
        <Link href="/privacidade" className="hover:text-texto">Política de Privacidade</Link> {/* link pra ler como os dados são tratados */}
      </p>
      <p className="mt-1">
        Desenvolvido por{" "}
        <a
          href="https://github.com/FabricioSobreira2004"
          target="_blank" // abre em outra aba, sem tirar o visitante do site
          rel="noreferrer" // evita que a página aberta tenha acesso à aba de origem (boa prática de segurança em links externos)
          className="font-medium text-dourado hover:text-dourado-claro"
        >
          Fabrício Sobreira
        </a>
      </p>
    </footer>
  );
}
