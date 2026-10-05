import { type Metadata } from "next"; // tipo da metadata desta página
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { FormularioRedefinirSenha } from "./FormularioRedefinirSenha"; // formulário (Client Component) desta página

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Redefinir senha | Fluxo Barber",
  description: "Defina uma nova senha para sua conta do Fluxo Barber.",
};

export default function PaginaRedefinirSenha() { // chegamos aqui só vindo do link de recuperação no email (ver app/auth/confirm/route.ts)
  return (
    <AuthCard titulo="Nova senha">
      <FormularioRedefinirSenha />
    </AuthCard>
  );
}
