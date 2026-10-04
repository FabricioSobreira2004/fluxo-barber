interface PropriedadesLogo { // o que o componente Logo recebe
  className?: string; // permite ajustar tamanho/posição de fora, sem perder o estilo base
}

export function Logo({ className = "" }: PropriedadesLogo) { // marca "Fluxo Barber" em texto, usada no topo das páginas
  return (
    <span className={`font-display text-2xl font-semibold tracking-tight text-texto ${className}`}>
      Fluxo <span className="text-dourado">Barber</span> {/* "Barber" em dourado, pra dar o destaque da marca */}
    </span>
  );
}
