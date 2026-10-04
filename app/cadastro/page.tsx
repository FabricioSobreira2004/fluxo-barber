import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação
import { FormularioCadastro } from "./FormularioCadastro"; // formulário (Client Component) desta página

export default function PaginaCadastro() { // página de criação de conta
  return (
    <AuthCard titulo="Criar conta">
      <FormularioCadastro />
    </AuthCard>
  );
}
