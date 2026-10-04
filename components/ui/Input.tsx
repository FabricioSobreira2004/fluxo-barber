import { type InputHTMLAttributes } from "react"; // tipo com todos os atributos que um <input> comum aceita
import { Calendar, Clock } from "lucide-react"; // ícones usados nos campos de data e hora

// o ícone nativo do navegador pros campos de data/hora (preto, fixo) some quase
// inteiro no fundo escuro do sistema; por isso ele é escondido (opacity-0, mas
// continua clicável no mesmo lugar) e um ícone dourado nosso é desenhado por cima
const CLASSES_BASE = // estilo comum a todo input de texto do sistema
  "w-full rounded-lg border border-borda bg-superficie px-3 py-2 text-texto placeholder:text-texto-secundario outline-none transition-colors focus:border-dourado";

export function Input({ className = "", type, ...resto }: InputHTMLAttributes<HTMLInputElement>) { // campo de texto padrão do sistema
  const ehCampoDeData = type === "date"; // esses dois tipos têm o ícone nativo problemático
  const ehCampoDeHora = type === "time";

  if (!ehCampoDeData && !ehCampoDeHora) { // campo comum (texto, email, senha, número...): nada de especial, segue como antes
    return <input type={type} className={`${CLASSES_BASE} ${className}`} {...resto} />;
  }

  const Icone = ehCampoDeData ? Calendar : Clock; // qual ícone desenhar, de acordo com o tipo do campo

  return (
    <div className="relative"> {/* "relative" é a referência de posição pro ícone absoluto abaixo */}
      <input
        type={type}
        className={ // "peer" deixa o ícone reagir ao hover do input (peer-hover, lá embaixo); cursor-pointer avisa que é clicável
          `peer cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${CLASSES_BASE} ${className}`
        }
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
