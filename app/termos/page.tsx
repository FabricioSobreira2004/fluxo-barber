import { type Metadata } from "next"; // tipo da metadata desta página (título/descrição na aba e em buscadores)
import { PaginaLegal } from "@/components/PaginaLegal"; // layout compartilhado com /privacidade

export const metadata: Metadata = { // título/descrição específicos desta página (sobrescreve o padrão do layout.tsx)
  title: "Termos de Uso | Fluxo Barber",
  description: "Termos de uso do Fluxo Barber: regras de utilização do sistema de agendamento para barbearias.",
};

export default function PaginaTermos() { // página estática, não precisa de dados do banco
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="4 de outubro de 2026">
      <p>
        Este é um modelo inicial de Termos de Uso, escrito em linguagem simples para deixar claro
        como o Fluxo Barber funciona. Ele ainda precisa ser revisado por um advogado antes do
        lançamento comercial (ver <strong>PENDENCIAS.md</strong> do projeto).
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Fluxo Barber é um sistema (SaaS — software como serviço) de agendamento online para
        barbearias. Ele permite que barbearias organizem sua agenda, sua equipe e seus serviços, e
        que os clientes dessas barbearias marquem horário sozinhos, pela internet.
      </p>

      <h2>2. Aceitação destes termos</h2>
      <p>
        Ao criar uma conta no Fluxo Barber, você concorda com estes Termos de Uso e com a nossa{" "}
        <a href="/privacidade">Política de Privacidade</a>. Se você não concordar com algum ponto,
        não deve usar o sistema.
      </p>

      <h2>3. Quem pode usar o sistema</h2>
      <p>
        O painel do Fluxo Barber (cadastro, login, agenda, equipe, serviços) é destinado a donos e
        funcionários de barbearias. A página pública de agendamento (<code>/b/[endereço-da-barbearia]</code>)
        é aberta a qualquer pessoa que queira marcar um horário, sem precisar criar conta.
      </p>

      <h2>4. Sua conta</h2>
      <p>
        Você é responsável por manter sua senha em seguro e por tudo que acontecer usando sua
        conta. Avise-nos imediatamente se suspeitar de uso indevido da sua conta.
      </p>

      <h2>5. Relação entre a barbearia e seus clientes</h2>
      <p>
        O Fluxo Barber fornece a ferramenta, mas quem presta o serviço de barbearia (corte, barba,
        etc.) é a própria barbearia cadastrada no sistema, não o Fluxo Barber. Qualquer combinação,
        cobrança ou cancelamento de horário é entre a barbearia e o cliente dela.
      </p>

      <h2>6. Uso aceitável</h2>
      <p>
        Não é permitido usar o sistema para fins ilegais, para enviar spam, ou para tentar acessar
        dados de outras barbearias sem autorização. Agendamentos públicos feitos de má-fé (ex: em
        excesso, pra &ldquo;travar&rdquo; a agenda de outra pessoa) podem ser removidos.
      </p>

      <h2>7. Disponibilidade do serviço</h2>
      <p>
        Fazemos o possível para manter o sistema sempre disponível, mas não garantimos
        funcionamento ininterrupto. Manutenções, falhas técnicas ou dos nossos fornecedores
        (Supabase, Vercel) podem causar indisponibilidade temporária.
      </p>

      <h2>8. Alterações nestes termos</h2>
      <p>
        Podemos atualizar estes termos ao longo do tempo. A data no topo desta página mostra
        quando foi a última atualização.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas sobre estes termos podem ser enviadas para <strong>[EMAIL DE CONTATO]</strong>.
      </p>
    </PaginaLegal>
  );
}
