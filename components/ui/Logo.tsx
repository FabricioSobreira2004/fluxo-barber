import { PosteBarbeiro } from "@/components/ui/PosteBarbeiro"; // ícone SVG do poste de barbeiro giratório

interface PropriedadesLogo { // o que o componente Logo recebe
  className?: string; // permite ajustar o tamanho do texto de fora (ex: "text-lg"); o ícone acompanha automaticamente
}

export function Logo({ className = "" }: PropriedadesLogo) { // marca "Fluxo Barber" (ícone + texto), usada no topo das páginas
  return (
    <span // "inline-flex" alinha o ícone e o texto na mesma linha, com um respiro entre eles
      className={`inline-flex items-center gap-1.5 font-display text-2xl font-semibold tracking-tight text-texto ${className}`}
    >
      {/* "1.25em" de altura: o ícone cresce/encolhe junto com o tamanho do texto (controlado pelo className de fora),
          sem precisar de uma prop de tamanho separada */}
      <PosteBarbeiro className="h-[1.25em] w-auto" aria-hidden />
      Fluxo <span className="text-dourado">Barber</span> {/* "Barber" em dourado, pra dar o destaque da marca */}
    </span>
  );
}
