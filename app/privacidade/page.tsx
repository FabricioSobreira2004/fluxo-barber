import { type Metadata } from "next"; // tipo da metadata desta página (título/descrição na aba e em buscadores)
import { PaginaLegal } from "@/components/PaginaLegal"; // layout compartilhado com /termos

export const metadata: Metadata = { // título/descrição específicos desta página (sobrescreve o padrão do layout.tsx)
  title: "Política de Privacidade | Fluxo Barber",
  description: "Como o Fluxo Barber coleta, usa e protege os dados de donos de barbearia, equipe e clientes.",
};

export default function PaginaPrivacidade() { // página estática, não precisa de dados do banco
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="4 de outubro de 2026">
      <p>
        Este é um modelo inicial de Política de Privacidade, escrito em linguagem simples. Ele
        ainda precisa ser revisado por um advogado antes do lançamento comercial (ver{" "}
        <strong>PENDENCIAS.md</strong> do projeto).
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Fluxo Barber é um sistema de agendamento online para barbearias. Esta política explica
        quais dados pessoais tratamos, para quê, e quais são os seus direitos.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <p>Coletamos tipos diferentes de dados, dependendo de quem você é:</p>
      <p>
        <strong>Donos e equipe de barbearia</strong> (quem cria conta no painel): coletamos o seu
        email, usado para login e comunicação sobre a conta.
      </p>
      <p>
        <strong>Clientes das barbearias</strong> (quem agenda um horário, com ou sem login):
        coletamos nome e telefone, usados pela barbearia pra identificar quem marcou o horário e
        entrar em contato, se precisar.
      </p>

      <h2>3. Para que usamos esses dados</h2>
      <p>
        Usamos os dados só para o funcionamento do serviço: criar e gerenciar contas, autenticar o
        login, organizar a agenda da barbearia, e permitir que a barbearia identifique e entre em
        contato com seus próprios clientes. Não vendemos nem compartilhamos esses dados com
        terceiros para fins de marketing.
      </p>

      <h2>4. Onde os dados ficam armazenados</h2>
      <p>
        O banco de dados do Fluxo Barber é hospedado pelo <strong>Supabase</strong>, e o site em si
        é hospedado pela <strong>Vercel</strong>. Ambos são fornecedores de infraestrutura em nuvem
        contratados pelo Fluxo Barber; eles não têm acesso aos dados fora do necessário para
        operar os serviços que fornecem.
      </p>

      <h2>5. Por quanto tempo guardamos os dados</h2>
      <p>
        Guardamos os dados enquanto a conta da barbearia estiver ativa. Se uma barbearia encerrar
        sua conta, os dados podem ser apagados ou anonimizados num prazo razoável, exceto quando
        formos obrigados por lei a manter algum registro por mais tempo.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos apenas cookies <strong>essenciais</strong>, necessários para manter você logado no
        painel (sessão de autenticação). Não usamos cookies de rastreamento ou de publicidade.
      </p>

      <h2>7. Seus direitos (LGPD)</h2>
      <p>
        De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: confirmar se
        tratamos seus dados, acessar os dados que temos sobre você, corrigir dados incompletos ou
        incorretos, e solicitar a exclusão dos seus dados (quando não houver outro motivo legal
        para mantê-los). Para exercer esses direitos, entre em contato pelo email{" "}
        <a href="mailto:contato.fluxobarber@gmail.com" className="font-medium text-dourado hover:text-dourado-claro">contato.fluxobarber@gmail.com</a>.
      </p>

      <h2>8. Papel de cada um (controlador e operador)</h2>
      <p>
        Em relação aos dados dos <strong>clientes de uma barbearia</strong> (nome e telefone): a{" "}
        <strong>barbearia é a controladora</strong> desses dados — ela decide por que coleta e
        como usa essas informações no dia a dia do seu negócio. O{" "}
        <strong>Fluxo Barber atua como operador</strong> — fornecemos o sistema que armazena e
        processa esses dados em nome da barbearia, seguindo as instruções dela e esta política.
      </p>

      <h2>9. Alterações nesta política</h2>
      <p>
        Podemos atualizar esta política ao longo do tempo. A data no topo desta página mostra
        quando foi a última atualização.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas, solicitações ou pedidos relacionados aos seus dados podem ser enviados para{" "}
        <a href="mailto:contato.fluxobarber@gmail.com" className="font-medium text-dourado hover:text-dourado-claro">contato.fluxobarber@gmail.com</a>.
      </p>
    </PaginaLegal>
  );
}
