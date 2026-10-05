import { type HTMLAttributes } from "react"; // tipo com todos os atributos que uma <div> comum aceita

export function Skeleton({ className = "", ...resto }: HTMLAttributes<HTMLDivElement>) { // bloco "piscando" usado nas telas de carregamento (loading.tsx)
  return (
    <div
      aria-hidden // é só um efeito visual; leitor de tela não precisa anunciar isso
      className={`animate-pulse rounded-lg bg-borda ${className}`} // "animate-pulse" já vem pronto no Tailwind (opacidade sobe e desce)
      {...resto} // repassa width/height etc. via className de quem usa
    />
  );
}
