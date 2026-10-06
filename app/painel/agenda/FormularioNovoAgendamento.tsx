"use client"; // precisa de useState/useEffect/useActionState (só existem no navegador), por isso vira Client Component

import { useActionState, useEffect, useState, type FormEvent } from "react"; // hooks de estado/efeito e o hook que liga o form à Server Action
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Select } from "@/components/ui/Select"; // menu de opções estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { criarAgendamento, verificarExpediente, type EstadoAgenda } from "./actions"; // Server Actions usadas por este formulário
import { aplicarMascaraTelefone, formatarTelefone, normalizarTelefone } from "@/utils/telefone"; // formata/normaliza o telefone, igual à página pública
import { validarNomeCliente, validarTelefoneCliente } from "@/utils/validacao"; // mesmas regras de validação usadas no banco (migration 003)
import { type Tabelas } from "@/utils/supabase/database.types"; // tipos gerados do banco (ver PENDENCIAS.md)

const ESTADO_INICIAL: EstadoAgenda = {}; // nenhum erro antes do primeiro envio

type Barbeiro = Pick<Tabelas<"barbeiros">, "id" | "nome">; // só os campos que este formulário usa, direto do tipo gerado da tabela
type Servico = Pick<Tabelas<"servicos">, "id" | "nome">; // idem
type Cliente = Pick<Tabelas<"clientes">, "nome" | "telefone">; // usado só pra sugerir no campo de telefone

interface PropriedadesFormularioNovoAgendamento {
  barbeiros: Barbeiro[];
  servicos: Servico[];
  clientes: Cliente[]; // alimenta a sugestão (datalist) do campo de telefone
  dataSelecionada: string; // dia que está sendo visualizado na agenda, pra já vir preenchido
  barbeiroPreSelecionado?: string; // quando a agenda já está filtrada por um barbeiro, começa com ele escolhido
  // chamado só quando a Server Action termina SEM erro: avisa o pai (AgendaInterativa) pra buscar a lista
  // do dia de novo (agora a lista vive em memória no cliente, não vem mais pronta do servidor a cada ação)
  aoCriarComSucesso?: () => void;
}

export function FormularioNovoAgendamento({
  barbeiros,
  servicos,
  clientes,
  dataSelecionada,
  barbeiroPreSelecionado,
  aoCriarComSucesso,
}: PropriedadesFormularioNovoAgendamento) {
  const [estado, acao, pendente] = useActionState(criarAgendamento, ESTADO_INICIAL); // conecta o form à Server Action "criarAgendamento"

  useEffect(() => { // dispara só quando um envio de verdade termina sem erro (não no carregamento inicial do componente)
    if (estado !== ESTADO_INICIAL && !estado.erro) {
      aoCriarComSucesso?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa reagir à mudança de "estado"; "aoCriarComSucesso" é estável (useCallback no pai)
  }, [estado]);

  // barbeiro/data/hora precisam ser campos "controlados" (com useState) pra conseguirmos observar
  // toda mudança e perguntar ao servidor se esse horário bate com o expediente cadastrado
  const [barbeiroId, setBarbeiroId] = useState(barbeiroPreSelecionado ?? "");
  const [data, setData] = useState(dataSelecionada);
  const [hora, setHora] = useState("");
  const [foraDoExpediente, setForaDoExpediente] = useState(false); // true quando o horário não cai em nenhum intervalo cadastrado
  const [telefoneCliente, setTelefoneCliente] = useState(""); // controlado pra aplicar a máscara "(DD) XXXXX-XXXX" enquanto digita
  const [erroValidacao, setErroValidacao] = useState(""); // erro encontrado ANTES de enviar (mesmas regras do banco), pra não gastar uma chamada de rede

  useEffect(() => { // toda vez que barbeiro, data ou hora mudam, confere de novo o expediente
    let cancelado = false; // evita atualizar o estado se um novo efeito já começou antes deste terminar (digitação rápida)

    async function conferir() {
      if (!barbeiroId || !data || !hora) { // sem dados suficientes ainda: não mostra aviso nenhum
        if (!cancelado) setForaDoExpediente(false);
        return;
      }

      const dentroDoExpediente = await verificarExpediente(barbeiroId, data, hora);
      if (!cancelado) setForaDoExpediente(!dentroDoExpediente);
    }

    conferir();

    return () => { // roda antes do próximo efeito (ou ao desmontar), marcando esta rodada como ultrapassada
      cancelado = true;
    };
  }, [barbeiroId, data, hora]);

  function aoSubmeter(evento: FormEvent<HTMLFormElement>) { // roda antes da Server Action, com as mesmas regras de validação do banco
    setErroValidacao("");

    const erroTelefone = validarTelefoneCliente(telefoneCliente);
    if (erroTelefone) {
      evento.preventDefault(); // trava o envio: não vale a pena chamar o servidor com um telefone que o banco vai recusar
      setErroValidacao(erroTelefone);
      return;
    }

    const telefoneJaCadastrado = clientes.some((cliente) => cliente.telefone === normalizarTelefone(telefoneCliente));
    if (!telefoneJaCadastrado) { // telefone novo: precisa de um nome válido (cliente existente já tem nome cadastrado)
      const nomeDigitado = new FormData(evento.currentTarget).get("nomeCliente");
      const erroNome = validarNomeCliente(String(nomeDigitado ?? ""));
      if (erroNome) {
        evento.preventDefault();
        setErroValidacao(erroNome);
      }
    }
  }

  return (
    <form action={acao} onSubmit={aoSubmeter} className="flex flex-col gap-4"> {/* ao enviar, valida e então o React chama a Server Action */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefoneCliente">Telefone do cliente</Label>
          <Input
            id="telefoneCliente"
            name="telefoneCliente"
            placeholder="(11) 99999-9999"
            value={telefoneCliente}
            onChange={(evento) => setTelefoneCliente(aplicarMascaraTelefone(evento.target.value))} // reformata a cada tecla digitada
            list="clientes-existentes" // liga esse campo à lista de sugestões abaixo
            inputMode="numeric" // teclado numérico no celular, já que só números fazem sentido aqui
            required
          />
          <datalist id="clientes-existentes"> {/* sugestão nativa do navegador: digitando o telefone, aparece o nome de quem já é cliente */}
            {clientes.map((cliente) => (
              // valor formatado igual ao que aparece no campo, senão o navegador não casa a sugestão com o texto já digitado
              <option key={cliente.telefone} value={formatarTelefone(cliente.telefone)}>
                {cliente.nome}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="nomeCliente">Nome do cliente (se for novo)</Label>
          <Input id="nomeCliente" name="nomeCliente" placeholder="Nome completo" />
        </div>

        <div>
          <Label htmlFor="barbeiro">Barbeiro</Label>
          <Select id="barbeiro" name="barbeiro" value={barbeiroId} onChange={(evento) => setBarbeiroId(evento.target.value)} required>
            <option value="" disabled>Escolha um barbeiro</option>
            {barbeiros.map((barbeiro) => (
              <option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="servico">Serviço</Label>
          <Select id="servico" name="servico" defaultValue="" required>
            <option value="" disabled>Escolha um serviço</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>{servico.nome}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" value={data} onChange={(evento) => setData(evento.target.value)} required />
        </div>

        <div>
          <Label htmlFor="hora">Hora</Label>
          <Input id="hora" name="hora" type="time" value={hora} onChange={(evento) => setHora(evento.target.value)} required />
        </div>
      </div>

      {foraDoExpediente && ( // só avisa, não impede o envio: o dono pode querer encaixar alguém fora do horário cadastrado
        <p className="rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-sm text-aviso">
          Fora do expediente cadastrado deste barbeiro
        </p>
      )}

      <div>
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Input id="observacao" name="observacao" placeholder="Ex: pediu pra não cortar muito" />
      </div>

      <FormMessage tipo="erro">{erroValidacao || estado.erro}</FormMessage> {/* validação local tem prioridade; senão mostra o erro do servidor */}

      <Button type="submit" disabled={pendente} className="w-full sm:w-auto"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Agendando..." : "Criar agendamento"}
      </Button>
    </form>
  );
}
