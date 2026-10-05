import { type Metadata } from "next"; // tipo da metadata desta página
import Link from "next/link"; // navegação entre páginas sem recarregar tudo
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão no link de ação principal

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Link inválido | Fluxo Barber",
  description: "O link de confirmação ou de recuperação de senha é inválido ou expirou.",
};

export default async function PaginaLinkInvalido(props: PageProps<"/auth/link-invalido">) { // PageProps gerado pelo Next.js a partir da rota
  const parametros = await props.searchParams; // searchParams é uma Promise no Next.js 16, por isso o await
  const ehRecuperacaoSenha = parametros.motivo === "recovery"; // diferencia a mensagem e o botão: recuperação de senha ou confirmação de cadastro

  return (
    <AuthCard titulo="Link inválido ou expirado">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-texto-secundario">
          {ehRecuperacaoSenha
            ? "O link que você usou para redefinir a senha não é mais válido — links de recuperação expiram depois de um tempo, por segurança, ou já foram usados antes."
            : "O link de confirmação de cadastro não é mais válido — ele pode já ter sido usado antes, ou ter expirado."}
        </p>

        {/* botão de ação: pede um novo link, pedindo o email de novo (não guardamos o email daqui pra reenviar sozinhos) */}
        <Link
          href={ehRecuperacaoSenha ? "/esqueci-senha" : "/cadastro"}
          className={`${classesBotao("primario")} w-full`}
        >
          {ehRecuperacaoSenha ? "Pedir novo link de recuperação" : "Criar conta de novo"}
        </Link>

        <Link href="/login" className="text-center text-sm text-dourado hover:text-dourado-claro">
          Já confirmou? Entrar
        </Link>
      </div>
    </AuthCard>
  );
}
