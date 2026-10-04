"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Select } from "@/components/ui/Select"; // menu de opções estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { criarAgendamento, type EstadoAgenda } from "./actions"; // Server Action e o formato do estado dela

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
          <Select id="barbeiro" name="barbeiro" defaultValue={barbeiroPreSelecionado ?? ""} required>
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
          <Input id="data" name="data" type="date" defaultValue={dataSelecionada} required />
        </div>

        <div>
          <Label htmlFor="hora">Hora</Label>
          <Input id="hora" name="hora" type="time" required />
        </div>
      </div>

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
