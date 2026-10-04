export default function Home() {                                                    // função que o Next.js chama pra montar a página inicial (rota "/")
  return (                                                                          // devolve o que vai aparecer na tela
    <main className="flex min-h-screen flex-col items-center justify-center gap-4"> {/* ocupa a tela inteira e centraliza tudo no meio */}
      <h1 className="text-5xl font-bold">Fluxo Barber 💈</h1>                      {/* título principal: grande e em negrito */}
      <p className="text-lg text-gray-400">Agendamento simples para barbearias</p> {/* subtítulo em cinza */}
    </main>                                                                         // fecha a área principal da página
  );                                                                                // fim do que a função devolve
}                                                                                   // fim da função
