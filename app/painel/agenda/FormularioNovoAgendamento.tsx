"use client"; // precisa de useState/useEffect/useActionState (só existem no navegador), por isso vira Client Component

import { useActionState, useEffect, useState } from "react"; // hooks de estado/efeito e o hook que liga o form à Server Action
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Select } from "@/components/ui/Select"; // menu de opções estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { criarAgendamento, verificarExpediente, type EstadoAgenda } from "./actions"; // Server Actions usadas por este formulário

const ESTADO_INICIAL: EstadoAgenda = {}; // nenhum erro antes do primeiro envio

interface Barbeiro { id: string; nome: string } // só os campos que este formulário usa
interface Servico { id: string; nome: string } // idem
interface Cliente { nome: string; telefone: string } // usado só pra sugerir no campo de telefone

interface PropriedadesFormularioNovoAgendamento {
  barbeiros: Barbeiro[];
  servicos: Servico[];
  clientes: Cliente[]; // alimenta a sugestão (datalist) do campo de telefone
  dataSelecionada: string; // dia que está sendo visualizado na agenda, pra já vir preenchido
  barbeiroPreSelecionado?: string; // quando a agenda já está filtrada por um barbeiro, começa com ele escolhido
}

export function FormularioNovoAgendamento({
  barbeiros,
  servicos,
  clientes,
  dataSelecionada,
  barbeiroPreSelecionado,
}: PropriedadesFormularioNovoAgendamento) {
  const [estado, acao, pendente] = useActionState(criarAgendamento, ESTADO_INICIAL); // conecta o form à Server Action "criarAgendamento"

  // barbeiro/data/hora precisam ser campos "controlados" (com useState) pra conseguirmos observar
  // toda mudança e perguntar ao servidor se esse horário bate com o expediente cadastrado
  const [barbeiroId, setBarbeiroId] = useState(barbeiroPreSelecionado ?? "");
  const [data, setData] = useState(dataSelecionada);
  const [hora, setHora] = useState("");
  const [foraDoExpediente, setForaDoExpediente] = useState(false); // true quando o horário não cai em nenhum intervalo cadastrado

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

  return (
    <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefoneCliente">Telefone do cliente</Label>
          <Input
            id="telefoneCliente"
            name="telefoneCliente"
            placeholder="(11) 99999-9999"
            list="clientes-existentes" // liga esse campo à lista de sugestões abaixo
            required
          />
          <datalist id="clientes-existentes"> {/* sugestão nativa do navegador: digitando o telefone, aparece o nome de quem já é cliente */}
            {clientes.map((cliente) => (
              <option key={cliente.telefone} value={cliente.telefone}>
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

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full sm:w-auto"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Agendando..." : "Criar agendamento"}
      </Button>
    </form>
  );
}
