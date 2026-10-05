import { type Metadata } from "next"; // tipo da metadata desta página
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { FormularioEsqueciSenha } from "./FormularioEsqueciSenha"; // formulário (Client Component) desta página

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Esqueci minha senha | Fluxo Barber",
  description: "Peça um link para recuperar o acesso à sua conta do Fluxo Barber.",
};

export default function PaginaEsqueciSenha() {
  return (
    <AuthCard titulo="Recuperar senha">
      <FormularioEsqueciSenha />
    </AuthCard>
  );
}
