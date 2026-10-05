import { type Metadata } from "next"; // tipo da metadata desta página
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { FormularioCadastro } from "./FormularioCadastro"; // formulário (Client Component) desta página

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Criar conta | Fluxo Barber",
  description: "Crie sua conta gratuita no Fluxo Barber e comece a organizar a agenda da sua barbearia.",
};

export default function PaginaCadastro() { // página de criação de conta
  return (
    <AuthCard titulo="Criar conta">
      <FormularioCadastro />
    </AuthCard>
  );
}
