// lista dos 3 passos mostrados na seção "Como funciona"; textos curtos, só o essencial do fluxo
const passos = [
  { numero: 1, texto: "Cadastre sua barbearia, seus barbeiros e os serviços que você oferece." },
  { numero: 2, texto: "Compartilhe o link da sua barbearia com os seus clientes." },
  { numero: 3, texto: "Os clientes agendam sozinhos, e você acompanha tudo no painel." },
];

export function ComoFunciona() { // seção "Como funciona": explica o fluxo em 3 passos simples, pra quem nunca usou
  return (
    <section className="px-6 py-16 md:px-12">
      <h2 className="mb-12 text-center font-display text-3xl font-bold text-texto md:text-4xl">
        Como funciona
      </h2>
      <div className="relative mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
        {/* linha dourada ligando os 3 passos: só no desktop, porque no celular os passos já ficam
            empilhados um embaixo do outro, bem claros sem precisar de linha nenhuma */}
        <div
          className="linha-como-funciona absolute inset-x-0 top-6 hidden h-px bg-dourado/25 md:block"
          aria-hidden
        />

        {passos.map(({ numero, texto }) => (
          <div key={numero} className="relative flex flex-col items-center gap-4 text-center">
            {/* "relative z-10": fica por cima da linha dourada, que passa atrás do círculo */}
            <span className="passo-numero relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-dourado font-display text-lg font-bold text-fundo">
              {numero}
            </span>
            <p className="max-w-xs text-sm text-texto/80">{texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
