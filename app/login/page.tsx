import { type Metadata } from "next"; // tipo da metadata desta página
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { FormularioLogin } from "./FormularioLogin"; // formulário (Client Component) desta página

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Entrar | Fluxo Barber",
  description: "Entre na sua conta do Fluxo Barber para acessar o painel da sua barbearia.",
};

export default async function PaginaLogin(props: PageProps<"/login">) { // PageProps gerado pelo Next.js a partir da rota
  const parametros = await props.searchParams; // searchParams é uma Promise no Next.js 16, por isso o await

  const redirecionarBruto = parametros.redirecionar; // pode ser string, array de strings ou undefined
  const redirecionarPara = // normaliza pra sempre virar uma única string
    typeof redirecionarBruto === "string" ? redirecionarBruto : "/onboarding";

  const erroBruto = parametros.erro; // ex: "link_invalido", mandado pela rota /auth/confirm quando o link falha
  const erroInicial = // traduz o código de erro em uma mensagem legível (só temos um caso por enquanto)
    erroBruto === "link_invalido"
      ? "Esse link de confirmação é inválido ou expirou. Tente entrar ou cadastre-se novamente."
      : undefined;

  return (
    <AuthCard titulo="Entrar">
      <FormularioLogin redirecionarPara={redirecionarPara} erroInicial={erroInicial} />
    </AuthCard>
  );
}
