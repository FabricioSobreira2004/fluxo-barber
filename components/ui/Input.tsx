import { type InputHTMLAttributes } from "react"; // tipo com todos os atributos que um <input> comum aceita
import { Calendar, Clock } from "lucide-react"; // ícones usados nos campos de data e hora

// o ícone nativo do navegador pros campos de data/hora (preto, fixo) some quase
// inteiro no fundo escuro do sistema; por isso ele é escondido (opacity-0, mas
// continua clicável no mesmo lugar) e um ícone dourado nosso é desenhado por cima.
// Sem "px-3" aqui: o padding horizontal muda por variante (comum vs. data/hora),
// então cada um define o próprio abaixo, em vez de um padding único pra todos.
const CLASSES_BASE = // estilo comum a todo input de texto do sistema
  "w-full rounded-lg border border-borda bg-superficie py-2 text-texto placeholder:text-texto-secundario outline-none transition-colors focus:border-dourado";

export function Input({ className = "", type, ...resto }: InputHTMLAttributes<HTMLInputElement>) { // campo de texto padrão do sistema
  const ehCampoDeData = type === "date"; // esses dois tipos têm o ícone nativo problemático
  const ehCampoDeHora = type === "time";

  if (!ehCampoDeData && !ehCampoDeHora) { // campo comum (texto, email, senha, número...): nada de especial, segue como antes
    return <input type={type} className={`${CLASSES_BASE} px-3 ${className}`} {...resto} />;
  }

  const Icone = ehCampoDeData ? Calendar : Clock; // qual ícone desenhar, de acordo com o tipo do campo

  return (
    // IMPORTANTE: "className" (o que quem usa o componente manda, ex: "flex-1 min-w-0") vai
    // NESTE <div>, não no <input> lá dentro — é ESTE elemento que participa de verdade do
    // layout flex/grid de quem chama <Input>; o <input> sempre ocupa 100% dele ("w-full", já
    // em CLASSES_BASE). Antes o className ia pro <input>, que fica dentro de um <div> sem
    // tamanho nenhum — então "w-28"/"flex-1" no <input> não mudava em nada o espaço que o
    // componente inteiro ocupava na tela, e era isso que deixava o botão ao lado espremido
    // pra fora do card em telas estreitas.
    <div className={`relative ${className}`}> {/* "relative" é a referência de posição pro ícone absoluto abaixo */}
      <input
        type={type}
        // "peer": deixa o ícone reagir ao hover do input (peer-hover, lá embaixo).
        // "pl-3 pr-9": a hora/data fica com espaço de sobra à direita (pr-9 = 36px), do
        // tamanho exato da área reservada pro ícone logo abaixo — sem isso, o valor digitado
        // (ex: "06:00") podia desenhar por baixo do ícone em campos mais estreitos.
        // "[&::-webkit-calendar-picker-indicator]:...": o indicador NATIVO do navegador, mesmo
        // com opacity 0, continuava ocupando espaço de verdade dentro do campo (só ficava
        // invisível, não "colapsava"), disputando lugar com o texto do valor. Virar
        // "position: absolute" tira ele do fluxo do texto — ele passa a flutuar numa área de
        // 36px coladinha na borda direita (mesmo tamanho do "pr-9" acima), exatamente atrás do
        // nosso ícone dourado: continua 100% clicável ali, só que sem empurrar o texto.
        // "min-w-0" AQUI (não só no <div> de fora, que já tinha): no Safari do iPhone, o próprio
        // <input type="time"> tem uma largura MÍNIMA intrínseca (o "relógio" com hora/minuto/AM-PM
        // embutido do WebKit), que o navegador respeita mesmo com "w-full" — sem "min-w-0" direto
        // no input, ele se recusa a encolher abaixo dessa largura nativa, e é isso que empurrava o
        // 2º campo (fim) pra fora da borda do card em telas estreitas, mesmo o <div> de fora já
        // tendo o tamanho certo. "text-base" (16px): evita o zoom automático do iOS ao focar um
        // campo com fonte menor que 16px (o resto do site usa o tamanho padrão do navegador, que já
        // é 16px, mas aqui fica explícito, por garantia, já que é exatamente o campo que o bug afetou.
        className={`
          peer min-w-0 cursor-pointer ${CLASSES_BASE} pr-9 pl-3 text-base
          [&::-webkit-calendar-picker-indicator]:absolute
          [&::-webkit-calendar-picker-indicator]:right-0
          [&::-webkit-calendar-picker-indicator]:h-full
          [&::-webkit-calendar-picker-indicator]:w-9
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          [&::-webkit-calendar-picker-indicator]:opacity-0
        `}
        {...resto}
      />
      {/* ícone decorativo dourado, por cima do ícone nativo (que ficou invisível, mas ainda está ali e continua clicável) */}
      <Icone
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dourado transition-colors peer-hover:text-dourado-claro"
        aria-hidden
      />
    </div>
  );
}
