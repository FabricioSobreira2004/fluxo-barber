"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { redirect } from "next/navigation"; // usado pra mandar o usuário pro painel após criar a barbearia
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { gerarSlug } from "@/utils/slug"; // garante que o slug final sempre fica no formato certo

export interface EstadoOnboarding { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

const REGEX_SLUG = new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$"); // só letras minúsculas, números e hífens simples (sem hífen duplo/nas pontas)

export async function criarBarbearia(_estadoAnterior: EstadoOnboarding, formData: FormData): Promise<EstadoOnboarding> { // Server Action do formulário de onboarding
  const nome = String(formData.get("nome") ?? "").trim(); // nome digitado pro negócio
  const slugDigitado = String(formData.get("slug") ?? "").trim(); // slug como o usuário deixou no campo (pode ter editado na mão)
  const slug = gerarSlug(slugDigitado || nome); // sempre reprocessa pelo gerarSlug, garantindo o formato certo mesmo se editado manualmente

  if (!nome) { // validação simples antes de gastar uma chamada de rede
    return { erro: "Digite o nome da barbearia." };
  }
  if (!slug || !REGEX_SLUG.test(slug)) { // slug vazio ou com caractere fora do padrão depois de normalizado
    return { erro: "Não foi possível gerar um endereço válido a partir desse nome. Tente ajustar o nome." };
  }

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { error } = await supabase.rpc("criar_barbearia", { p_nome: nome, p_slug: slug }); // chama a função do banco (cria a barbearia + vira "dono")

  if (error) {
    if (error.code === "23505") { // código do Postgres pra "violação de restrição única" (o slug já existe em outra barbearia)
      return { erro: `O endereço "${slug}" já está em uso por outra barbearia. Tente outro nome.` };
    }
    return { erro: "Não foi possível criar a barbearia. Tente novamente em instantes." }; // qualquer outro erro inesperado
  }

  redirect("/onboarding/configuracao-rapida"); // sucesso: a barbearia existe; antes do tour, oferece configurar barbeiro/serviço/horário rapidinho
}
