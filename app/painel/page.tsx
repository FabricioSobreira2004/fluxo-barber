import { redirect } from "next/navigation"; // a home do painel é a agenda; isso só redireciona pra lá

export default function PaginaPainel() {
  redirect("/painel/agenda");
}
