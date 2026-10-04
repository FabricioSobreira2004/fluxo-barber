import type { Metadata } from "next"; // tipo do Next.js para a metadata da página (título, descrição...)
import { Playfair_Display, Inter } from "next/font/google"; // fontes da identidade visual, carregadas e otimizadas pelo Next.js
import "./globals.css"; // estilos globais e tokens de cor/fonte da identidade visual

const playfair = Playfair_Display({ // fonte usada nos títulos: elegante, remete a uma placa de barbearia premium
  variable: "--font-playfair", // nome da variável CSS que vai guardar essa fonte (usada no globals.css)
  subsets: ["latin"], // só os caracteres latinos, pra baixar menos dados
});

const inter = Inter({ // fonte usada no texto corrido: moderna e com boa legibilidade em tela
  variable: "--font-inter", // nome da variável CSS correspondente
  subsets: ["latin"],
});

export const metadata: Metadata = { // informações que aparecem na aba do navegador e em buscadores
  title: "Fluxo Barber", // título padrão do site
  description: "Agendamento online para barbearias: agenda, equipe e serviços em um só lugar.", // descrição curta do produto
};

export default function RootLayout({ children }: LayoutProps<"/">) { // envolve todas as páginas do site
  return (
    <html
      lang="pt-BR" // avisa o navegador/leitores de tela que o conteúdo é em português do Brasil
      className={`${playfair.variable} ${inter.variable} h-full antialiased`} // disponibiliza as fontes como variáveis CSS para toda a página
    >
      <body className="min-h-full flex flex-col">{children}</body> {/* corpo ocupa a tela toda, empilhado verticalmente */}
    </html>
  );
}
