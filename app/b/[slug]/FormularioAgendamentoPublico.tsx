"use client"; // precisa de estado e efeitos (useState/useEffect), por isso vira Client Component

import { useEffect, useState, useTransition, type FormEvent } from "react"; // hooks de estado/efeito do React
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Select } from "@/components/ui/Select"; // menu de opções estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { centavosParaReais } from "@/utils/dinheiro"; // formata o preço (centavos) pra exibição
import { hojeISO } from "@/utils/data"; // data de hoje, no fuso do Brasil
import { aplicarMascaraTelefone } from "@/utils/telefone"; // formata o telefone enquanto o cliente digita
import { validarNomeCliente, validarTelefoneCliente } from "@/utils/validacao"; // mesmas regras de validação usadas no banco (migration 003)
import { buscarHorariosLivres, criarAgendamentoPublico } from "./actions"; // funções do servidor chamadas direto (sem formulário tradicional)

interface Barbeiro { id: string; nome: string } // só os campos usados aqui
interface Servico { id: string; nome: string; duracao_min: number; preco_centavos: number }

interface PropriedadesFormulario {
  barbeariaId: string;
  barbeiros: Barbeiro[];
  servicos: Servico[];
}

export function FormularioAgendamentoPublico({ barbeariaId, barbeiros, servicos }: PropriedadesFormulario) {
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? ""); // serviço escolhido (começa com o primeiro da lista)
  const [barbeiroId, setBarbeiroId] = useState(barbeiros[0]?.id ?? ""); // barbeiro escolhido
  const [data, setData] = useState(hojeISO()); // data escolhida, começa em hoje
  const [horario, setHorario] = useState(""); // horário escolhido dentre os disponíveis
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]); // lista vinda do servidor
  const [buscandoHorarios, iniciarBuscaHorarios] = useTransition(); // true enquanto a busca de horários está rodando
  const [nome, setNome] = useState(""); // nome do cliente
  const [telefone, setTelefone] = useState(""); // telefone do cliente
  const [erro, setErro] = useState(""); // mensagem de erro do envio
  const [sucesso, setSucesso] = useState(false); // true depois que o agendamento é criado com sucesso
  const [enviando, iniciarEnvio] = useTransition(); // true enquanto o agendamento está sendo criado

  useEffect(() => { // toda vez que barbeiro, serviço ou data mudam, busca de novo os horários livres
    if (!barbeiroId || !servicoId || !data) return;

    iniciarBuscaHorarios(async () => {
      setHorario(""); // a escolha anterior pode não valer mais pro novo barbeiro/serviço/data
      const livres = await buscarHorariosLivres(barbeiroId, data, servicoId);
      setHorariosDisponiveis(livres);
    });
  }, [barbeiroId, servicoId, data]);

  function aoEnviar(evento: FormEvent) { // chamado ao clicar em "Confirmar agendamento"
    evento.preventDefault(); // evita o recarregamento padrão da página
    setErro("");

    if (!horario) {
      setErro("Escolha um horário.");
      return;
    }

    const erroNome = validarNomeCliente(nome); // mesma regra usada no banco (migration 003): entre 2 e 100 caracteres
    if (erroNome) {
      setErro(erroNome);
      return;
    }
    const erroTelefone = validarTelefoneCliente(telefone); // mesma regra usada no banco: 10 ou 11 dígitos
    if (erroTelefone) {
      setErro(erroTelefone);
      return;
    }

    iniciarEnvio(async () => {
      const resultado = await criarAgendamentoPublico({ barbeariaId, barbeiroId, servicoId, data, hora: horario, nome, telefone });

      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }

      setSucesso(true); // mostra a mensagem de confirmação no lugar do formulário
    });
  }

  const servicoEscolhido = servicos.find((s) => s.id === servicoId); // usado só pra mostrar o nome na tela de confirmação

  if (sucesso) { // depois de agendar com sucesso, troca o formulário por uma confirmação simples
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-lg text-sucesso">Agendamento confirmado!</p>
        <p className="text-sm text-texto-secundario">
          {/* horário e data são números: tabular-nums alinha os dígitos, font-bold reforça a leitura */}
          {servicoEscolhido?.nome} às <span className="font-bold tabular-nums">{horario}</span>, no dia{" "}
          <span className="font-bold tabular-nums">{data.split("-").reverse().join("/")}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="servico">Serviço</Label>
        <Select id="servico" value={servicoId} onChange={(evento) => setServicoId(evento.target.value)} required>
          {servicos.map((servico) => (
            <option key={servico.id} value={servico.id}>
              {servico.nome} — {servico.duracao_min} min — R$ {centavosParaReais(servico.preco_centavos)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="barbeiro">Barbeiro</Label>
        <Select id="barbeiro" value={barbeiroId} onChange={(evento) => setBarbeiroId(evento.target.value)} required>
          {barbeiros.map((barbeiro) => (
            <option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          type="date"
          value={data}
          min={hojeISO()} // trava datas passadas direto no navegador (o servidor também recusa, por segurança)
          onChange={(evento) => setData(evento.target.value)}
          required
        />
      </div>

      <div>
        <Label>Horário</Label>
        {buscandoHorarios && <p className="text-sm text-texto-secundario">Buscando horários...</p>}
        {!buscandoHorarios && horariosDisponiveis.length === 0 && (
          <p className="text-sm text-texto-secundario">Nenhum horário livre nesse dia.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {horariosDisponiveis.map((h) => (
            <button
              key={h}
              type="button" // não envia o form: só seleciona o horário
              onClick={() => setHorario(h)}
              className={ // destaque dourado no horário escolhido; tabular-nums+font-bold porque é um número (horário)
                `rounded-lg border px-3 py-1 text-sm font-bold tabular-nums transition-colors ${
                  horario === h ? "border-dourado bg-dourado/10 text-dourado" : "border-borda text-texto-secundario hover:text-texto"
                }`
              }
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" value={nome} onChange={(evento) => setNome(evento.target.value)} required />
      </div>

      <div>
        <Label htmlFor="telefone">Seu telefone</Label>
        <Input
          id="telefone"
          value={telefone}
          onChange={(evento) => setTelefone(aplicarMascaraTelefone(evento.target.value))} // reformata a cada tecla digitada
          placeholder="(11) 99999-9999"
          inputMode="numeric" // teclado numérico no celular, já que só números fazem sentido aqui
          required
        />
      </div>

      <FormMessage tipo="erro">{erro}</FormMessage>

      <Button type="submit" disabled={enviando || !horario} className="w-full">
        {enviando ? "Agendando..." : "Confirmar agendamento"}
      </Button>
    </form>
  );
}
