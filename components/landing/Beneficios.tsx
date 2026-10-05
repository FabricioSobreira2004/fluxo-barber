"use client"; // usa useGSAP e ScrollTrigger, que só existem no navegador

import { useRef } from "react"; // guarda a referência à grade (escopo da animação e gatilho do ScrollTrigger)
import { CalendarCheck, Clock, Users, Scissors } from "lucide-react"; // ícones dos 4 cards de benefício
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { ScrollTrigger } from "gsap/ScrollTrigger"; // plugin que dispara a animação quando o elemento entra na tela

gsap.registerPlugin(useGSAP, ScrollTrigger); // registra os plugins antes de usá-los

const beneficios = [ // lista de benefícios mostrados na landing page, cada um com ícone, título e descrição
  {
    Icone: CalendarCheck,
    titulo: "Agenda online",
    descricao: "Seus clientes marcam horário sozinhos, a qualquer hora, sem precisar ligar pra barbearia.",
  },
  {
    Icone: Clock,
    titulo: "Sem conflito de horário",
    descricao: "O sistema trava automaticamente dois agendamentos no mesmo horário com o mesmo barbeiro.",
  },
  {
    Icone: Users,
    titulo: "Gestão de equipe",
    descricao: "Cadastre seus barbeiros, defina os horários de trabalho de cada um e acompanhe a agenda.",
  },
  {
    Icone: Scissors,
    titulo: "Serviços e preços",
    descricao: "Organize os serviços oferecidos, com duração e preço, e deixe a agenda calcular o resto.",
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
          y: 28, // e um pouco abaixo da posição final
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15, // um card aparece pouco depois do outro, em vez de todos juntos
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
    <section ref={gradeRef} className="grid gap-6 px-6 py-16 md:grid-cols-2 md:px-12 lg:grid-cols-4">
      {beneficios.map(({ Icone, titulo, descricao }) => (
        <div
          key={titulo}
          className="card-beneficio group rounded-xl border border-borda bg-superficie p-6" // "group" liga o hover do ícone lá dentro
        >
          <Icone
            className="mb-3 h-8 w-8 text-dourado motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:drop-shadow-[0_0_6px_rgba(224,192,104,0.7)]" // brilho + leve aumento no hover; "motion-safe:" some inteiro pra quem pediu movimento reduzido
            aria-hidden // ícone decorativo; o título do card já explica o conteúdo
          />
          <h3 className="mb-2 font-display text-lg font-semibold text-texto">{titulo}</h3>
          <p className="text-sm text-texto-secundario">{descricao}</p>
        </div>
      ))}
    </section>
  );
}
