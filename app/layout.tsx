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

const DESCRICAO_PADRAO = "Agendamento online para barbearias: agenda, equipe e serviços em um só lugar."; // reaproveitada no OG abaixo, pra não repetir o texto em dois lugares

export const metadata: Metadata = { // informações que aparecem na aba do navegador, em buscadores, e ao compartilhar o link
  // "VERCEL_URL" é preenchida automaticamente pela Vercel em cada deploy; sem ela (ex: rodando local), cai no localhost.
  // Isso é necessário pra transformar a imagem de compartilhamento (app/opengraph-image.tsx) num link completo (https://...)
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "Fluxo Barber", // título padrão; páginas internas sobrescrevem com o próprio (ex: "Termos de Uso | Fluxo Barber")
  description: DESCRICAO_PADRAO, // descrição curta do produto, usada quando a página não define a própria
  openGraph: { // como o link aparece quando compartilhado (ex: WhatsApp, Telegram, redes sociais)
    title: "Fluxo Barber",
    description: DESCRICAO_PADRAO,
    siteName: "Fluxo Barber",
    locale: "pt_BR", // avisa que o conteúdo é em português do Brasil
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) { // envolve todas as páginas do site
  return (
    <html
      lang="pt-BR" // avisa o navegador/leitores de tela que o conteúdo é em português do Brasil
      className={`${playfair.variable} ${inter.variable} h-full antialiased`} // disponibiliza as fontes como variáveis CSS para toda a página
    >
      {/* corpo ocupa a tela toda, empilhado verticalmente */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
