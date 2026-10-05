"use client"; // usa useGSAP e ScrollTrigger, que só existem no navegador

import { useRef } from "react"; // guarda a referência à grade (escopo da animação e gatilho do ScrollTrigger)
import { CalendarCheck, Clock, Users, Scissors, TrendingUp, Crown } from "lucide-react"; // ícones dos 6 cards de benefício
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { ScrollTrigger } from "gsap/ScrollTrigger"; // plugin que dispara a animação quando o elemento entra na tela
import { Destaque } from "@/components/ui/Destaque"; // trecho de texto em dourado, usado nas palavras-chave de cada card

gsap.registerPlugin(useGSAP, ScrollTrigger); // registra os plugins antes de usá-los

// lista de benefícios mostrados na landing page: foco na dor E no ganho do dono de barbearia
// (tempo, lucro, imagem profissional), nunca só na descrição técnica da função.
// IMPORTANTE: a pontuação (vírgula, ponto) sempre colada no fechamento do <Destaque>, na mesma
// linha, sem espaço — só assim ela nunca "escapa" sozinha pra linha seguinte (ver Destaque.tsx)
const beneficios = [
  {
    Icone: CalendarCheck,
    titulo: "Agenda online 24h",
    descricao: (
      <>
        Seu cliente marca o horário <Destaque>pelo celular, a qualquer hora</Destaque>, sem
        precisar te chamar no WhatsApp.
      </>
    ),
  },
  {
    Icone: Clock,
    titulo: "Zero horário duplicado",
    descricao: (
      <>
        O sistema <Destaque>bloqueia automaticamente</Destaque> dois clientes no mesmo horário com
        o mesmo barbeiro. Acabou o encaixe em cima de encaixe.
      </>
    ),
  },
  {
    Icone: Users,
    titulo: "Equipe organizada",
    descricao: (
      <>
        Cada barbeiro com seus horários e sua agenda, <Destaque>tudo em um só lugar</Destaque>, no
        computador ou no celular.
      </>
    ),
  },
  {
    Icone: Scissors,
    titulo: "Serviços e preços",
    descricao: (
      <>
        Cadastre cortes, barbas e combos com <Destaque>preço e duração</Destaque>, e a agenda
        calcula o resto.
      </>
    ),
  },
  {
    Icone: TrendingUp,
    titulo: "Mais tempo, mais lucro",
    descricao: (
      <>
        Menos tempo no celular marcando horário é <Destaque>mais tempo na cadeira</Destaque>{" "}
        atendendo. Agenda organizada, cadeira sempre ocupada.
      </>
    ),
  },
  {
    Icone: Crown,
    titulo: "Barbearia de alto padrão",
    descricao: (
      <>
        Um link profissional com o nome da sua barbearia passa confiança e mostra ao cliente que
        ele está em <Destaque>outro nível</Destaque>.
      </>
    ),
  },
];

export function Beneficios() { // grade de 4 cards que aparecem um a um conforme o usuário rola a página até eles
  const gradeRef = useRef<HTMLElement>(null); // raiz da grade: escopo da animação e "trigger" do ScrollTrigger

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // controlador que liga/desliga a animação conforme a preferência de movimento

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // só anima se o usuário NÃO pediu movimento reduzido; senão os cards aparecem direto, parados
        gsap.from(".card-beneficio", {
          autoAlpha: 0, // começa invisível (autoAlpha também evita cliques acidentais antes de aparecer)
          y: 48, // e bem mais abaixo da posição final (antes era 28px — deslize maior, mais perceptível)
          scale: 0.95, // começa levemente menor e cresce até o tamanho final, reforçando a entrada
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.12, // um card aparece pouco depois do outro; com 6 cards agora, um stagger menor evita que o último demore demais pra aparecer
          clearProps: "all", // ao terminar, remove o style inline (opacity/transform) — garante que os 4 cards acabem exatamente iguais (y:0, scale:1), sem nenhum resíduo de arredondamento
          scrollTrigger: {
            trigger: gradeRef.current,
            start: "top 85%", // dispara quando o topo da grade chega perto do fim da área visível da tela
            once: true, // anima só na primeira vez que a grade aparece; não refaz ao rolar pra cima e descer de novo
          },
        });
      });

      return () => mm.revert(); // desfaz a animação, o ScrollTrigger e o listener de media query ao desmontar
    },
    { scope: gradeRef } // ".card-beneficio" só é buscado dentro desta grade
  );

  return (
    // "py-16 md:py-20": mesmo ritmo vertical das outras seções da página (Como funciona, Chamada final)
    <section ref={gradeRef} className="px-6 py-16 md:px-12 md:py-20">
      {/* "mx-auto max-w-6xl": mesma largura máxima e mesmo alinhamento das outras seções.
          "items-stretch" (redundante com o padrão do grid, mas explícito): garante que os 6 cards
          fiquem com a MESMA altura na mesma linha, mesmo quando o texto de um é maior que o outro.
          3 colunas no desktop (2 linhas de 3), 2 no tablet (3 linhas de 2), 1 no celular */}
      <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {beneficios.map(({ Icone, titulo, descricao }) => (
          <div
            key={titulo}
            // "h-full flex flex-col": o card preenche toda a altura da célula do grid (que já é igual
            // pra todos, graças ao "items-stretch" acima) e o conteúdo fica alinhado ao topo (padrão do flex-col)
            className="card-beneficio group flex h-full flex-col rounded-xl border border-borda bg-superficie p-6 motion-safe:transition-[transform,border-color] motion-safe:duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:hover:border-dourado/70"
          >
            <Icone
              className="mb-3 h-8 w-8 text-dourado motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:drop-shadow-[0_0_6px_rgba(224,192,104,0.7)]" // brilho + leve aumento no hover; "motion-safe:" some inteiro pra quem pediu movimento reduzido
              aria-hidden // ícone decorativo; o título do card já explica o conteúdo
            />
            <h3 className="mb-2 font-display text-lg font-semibold text-texto">{titulo}</h3>
            <p className="text-pretty text-sm text-texto/80">{descricao}</p> {/* "text-texto/80": mais claro que o cinza de antes; "text-pretty": evita linha curta e feia no fim do parágrafo */}
          </div>
        ))}
      </div>
    </section>
  );
}
