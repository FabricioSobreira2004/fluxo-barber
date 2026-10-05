# Relatório — sessão autônoma (etapas 5 a 14)

Este arquivo resume tudo o que foi feito enquanto você estava fora, como
testar cada parte, o que ainda falta configurar no Supabase, e sugestões de
próximos passos.

**Veja sempre o [PENDENCIAS.md](PENDENCIAS.md)** para a lista atualizada do
que falta fazer no painel do Supabase — esse arquivo é reorganizado a cada
rodada em "Concluído", "Para fazer agora" e "Pré-lançamento".

---

## Nova rodada — link de confirmação, copy de vendas e animações mais fortes (outubro de 2026)

Esta rodada teve 3 partes independentes, cada uma com seu próprio commit.

### Parte 1 — link de confirmação compatível com o template padrão do Supabase

**Arquivos:** `app/auth/confirm/route.ts`, `app/auth/link-invalido/page.tsx` (novo),
`app/login/page.tsx`, `app/login/FormularioLogin.tsx`, `PENDENCIAS.md`

- **O problema:** no plano gratuito do Supabase, sem SMTP próprio, não dá pra
  editar os templates de email — todo email sai com o template **padrão** do
  Supabase, que usa `{{ .ConfirmationURL }}`. Esse link aponta primeiro pro
  servidor do Supabase (`.../auth/v1/verify?token=...&type=...&redirect_to=...`),
  que confirma o token sozinho e só DEPOIS redireciona o navegador de volta
  pro site, com um parâmetro `?code=...` na URL (fluxo PKCE) — não com
  `token_hash` + `type`, que era o único formato que `app/auth/confirm/route.ts`
  sabia processar. Confirmei esse comportamento na documentação atual do
  Supabase (fluxo PKCE / `exchangeCodeForSession`).
- **A correção:** a rota agora aceita os dois formatos — `token_hash` + `type`
  (via `verifyOtp()`, formato que o template personalizado em
  `supabase/templates/` usa, pra quando tivermos SMTP próprio) **e** `code`
  (via `exchangeCodeForSession()`, formato do template padrão, que é o que
  está em uso hoje). Nenhum dos dois formatos quebra o outro.
- **`emailRedirectTo`/`redirectTo` já estavam certos:** conferi
  `app/cadastro/actions.ts` (manda pra `/auth/confirm?next=/onboarding`) e
  `app/esqueci-senha/actions.ts` (manda pra `/auth/confirm?next=/redefinir-senha`)
  — os dois já apontavam pro destino certo, não precisei mudar nada aí.
- **Link inválido ou expirado:** antes isso caía em `/login?erro=link_invalido`,
  com uma mensagem genérica que nem sempre fazia sentido (ex: mandava "tentar
  entrar" pra quem só queria recuperar a senha). Criei uma página dedicada,
  `/auth/link-invalido?motivo=recovery|signup`, com mensagem e botão diferentes
  pra cada caso: recuperação de senha manda pra `/esqueci-senha` (pedir um novo
  link), cadastro manda pra `/cadastro` (criar de novo, o que reenvia o email de
  confirmação). Removi o tratamento antigo de `?erro=` em `/login`, que ficou
  sem uso.
- **Teste de ponta a ponta:** como isso exige clicar num link de email de
  verdade, não dá pra eu testar sozinho — deixei o passo a passo completo (3
  cenários: cadastro, esqueci senha, e link usado duas vezes) no
  `PENDENCIAS.md`, seção "Para fazer agora".
- **`PENDENCIAS.md` reorganizado:** "colar os templates de email" saiu de
  "Para fazer agora" e foi pra "Pré-lançamento", junto com o SMTP próprio e o
  "Religar Confirm email" — expliquei a cadeia de dependência completa:
  domínio `fluxobarber.com.br` → SMTP próprio → liberação pra editar
  templates → religar a confirmação de email.

### Parte 2 — textos de vendas na landing page (copywriting)

**Arquivos novos:** `components/ui/Destaque.tsx`, `components/landing/ComoFunciona.tsx`,
`components/landing/ChamadaFinal.tsx`
**Arquivos alterados:** `components/landing/Hero.tsx`, `components/landing/Beneficios.tsx`, `app/page.tsx`

- Os textos eram só descrição de função ("Agenda online", "Gestão de
  equipe"). Reescrevi em cima da dor do **dono** da barbearia (WhatsApp
  tocando o dia todo, agenda bagunçada, encaixe em cima de encaixe) — segui
  à risca as sugestões de texto que você deu, só ajustando pontuação.
  **Nenhuma promessa nova:** revisei cada frase pra garantir que só descreve
  o que o sistema já faz hoje (agendamento pelo link público, sem conflito
  de horário, barbeiros/serviços/preços/horários, agenda no painel) — nada
  de "lembrete por WhatsApp", pagamento online ou relatório financeiro.
- **`Destaque`** (`components/ui/Destaque.tsx`): componente novo e
  reutilizável, só um `<strong>` dourado semi-negrito. Usado no subtítulo do
  hero e na descrição dos 4 cards, pra não repetir a mesma classe Tailwind
  em 7 lugares diferentes.
- **Cores mais claras:** subtítulo do hero passou de `text-texto-secundario`
  (cinza) pra `text-texto/90` (quase branco, com 90% de opacidade) e ficou
  um pouco maior (`md:text-xl`); descrição dos cards passou de
  `text-texto-secundario` pra `text-texto/80`. Os títulos (`h3` dos cards,
  `h1` do hero) continuam 100% brancos, pra manter a hierarquia.
- **Seção "Como funciona"** (`ComoFunciona.tsx`): 3 passos numerados (bolinha
  dourada com o número), ligados por uma linha dourada fina — só no desktop;
  no celular os passos já ficam empilhados, claros o suficiente sem linha.
- **Chamada final** (`ChamadaFinal.tsx`): título + frase curta + botão
  "Criar conta gratuita" em destaque, logo antes do rodapé — pra quem rolou
  a página inteira e ainda não decidiu.
- Conferi visualmente (desktop, via a ferramenta de navegador) que os textos,
  destaques dourados e as duas seções novas renderizam certo; só não dá pra
  ver a animação de entrada rodando ao vivo, pelo mesmo motivo já explicado
  na rodada anterior (aba em `visibilityState: "hidden"` nessa ferramenta).

### Parte 3 — animações mais marcantes

**Arquivos alterados:** `components/landing/Hero.tsx`, `components/landing/Beneficios.tsx`,
`components/landing/ComoFunciona.tsx`, `components/ui/Destaque.tsx`, `components/ui/PosteBarbeiro.tsx`

- **Título:** em vez de um `<span>` só, cada palavra ("Agendamento", "simples", "para", "barbearias")
  virou seu próprio `<span>` e entra com deslize de 40px e fade, uma depois da outra — total de
  ≈0,8s. Não usei o plugin **SplitText** (ele é gratuito desde a aquisição do GSAP pela Webflow,
  conferi isso antes de decidir) porque o texto é fixo e curto: separar as 4 palavras na mão é mais
  simples e mais leve que rodar um plugin de split em tempo de execução.
- **Brilho na palavra "barbearias":** uma faixa clara e inclinada (`<span>` decorativo, só
  `background` + `transform`), dentro de um contêiner com `overflow: hidden`, desliza uma vez só da
  esquerda pra direita por cima da palavra, logo que ela termina de aparecer.
- **Realce do subtítulo:** as 3 frases em dourado (`agendam sozinhos`, `24 horas por dia`, `sem
  horário duplicado`) dão um pequeno "pop" (escala de 0,85 até 1, com uma leve "molejada") pouco
  depois que o parágrafo já está visível — chama atenção sem precisar mudar de cor nem depender de
  nada além de `transform`/`opacity`.
- **Cards:** deslize de entrada maior (28px → 48px) e ganharam uma leve escala (de 0,95 até 1,0),
  com mais espaço entre a entrada de um card e outro. No hover, o card sobe um pouco
  (`translateY`) e a borda vira dourada — tudo dentro de `motion-safe:`, então some por completo
  pra quem pediu movimento reduzido.
- **"Como funciona":** virou Client Component. Os 3 números entram em sequência com uma leve
  "molejada" (`back.out`), e a linha dourada entre eles "se desenha" da esquerda pra direita ao
  mesmo tempo — isso é só `scaleX` de 0 até 1 com `transform-origin` na esquerda (não usei nenhum
  plugin de SVG tipo DrawSVG porque a linha já era uma `<div>` simples, não um `<path>`; `scaleX`
  faz o mesmo efeito visual gastando bem menos).
- **Poste do logo:** mesma animação de antes, só que mais rápida (3s → 1,6s por volta completa) —
  continua linear (`ease: "none"`) e suave, só perceptível mais rápido.
- Todas as animações continuam só `transform`/`opacity` (a única exceção, como já era antes, é o
  giro do poste, que mexe num atributo de `<pattern>` de SVG dentro de `<defs>` — não participa do
  layout, não dispara reflow) e continuam inteiras dentro do
  `gsap.matchMedia("(prefers-reduced-motion: no-preference)", ...)` de cada componente.

**O que observar ao recarregar (`Ctrl+Shift+R` em `http://localhost:3000`), nesta ordem:**

1. **Logo, no topo:** as listras do poste já estão girando desde o primeiro frame — repare que
   agora é visivelmente mais rápido que antes (uma volta a cada ~1,6s).
2. **Título:** as 4 palavras sobem e aparecem uma depois da outra ("Agendamento", "simples",
   "para", "barbearias") — o movimento todo dura menos de 1 segundo.
3. **Logo em seguida**, um brilho claro atravessa a palavra **"barbearias"**, uma vez só, da
   esquerda pra direita.
4. **Quase junto com o brilho**, o subtítulo aparece (fade + sobe de baixo), seguido pelos 2
   botões ("Criar conta gratuita" / "Já tenho conta"), um logo depois do outro.
5. **Por último nessa sequência**, as 3 frases douradas do subtítulo dão um pequeno "pop" — um
   realce rápido, quase no fim de toda a entrada.
6. **Role a página até os 4 cards:** cada um sobe de mais longe que antes e cresce levemente
   (começa um pouco menor) — dá pra notar mais o efeito "um de cada vez" que antes.
7. **Passe o mouse sobre um card:** ele sobe um pouquinho e a borda vira dourada.
8. **Role até "Como funciona":** os números 1, 2 e 3 aparecem em sequência (com uma leve
   "molejada"), e repare a linha dourada entre eles — ela cresce da esquerda pra direita ao mesmo
   tempo, como se estivesse sendo desenhada.
9. **Pra conferir o "movimento reduzido":** ative essa opção no sistema (Windows: Configurações →
   Acessibilidade → Efeitos visuais → "Mostrar animações no Windows" desligado) e recarregue —
   título, subtítulo, cards e passos devem aparecer **direto no estado final, sem nenhuma
   animação**, e o poste do logo deve ficar **parado**.

---

## Nova rodada — animações GSAP na landing page (outubro de 2026)

### 1. GSAP instalado
**Arquivo:** `package.json`
- `npm install gsap @gsap/react`. Só essas duas dependências; nada mais mudou
  no projeto.

### 2. Hero (título, subtítulo e botões) com animação de entrada
**Arquivo novo:** `components/landing/Hero.tsx`
- Virou um Client Component separado (antes esse bloco vivia dentro de
  `app/page.tsx`, que é Server Component). Ao carregar a página, uma
  timeline do GSAP anima: título (fade + leve deslize de baixo pra cima) →
  subtítulo, começando um pouco antes do título terminar → os dois botões
  ("Criar conta gratuita" / "Já tenho conta"), um logo depois do outro.
- Usa o hook `useGSAP` (de `@gsap/react`), que limpa a animação sozinho
  quando o componente desmonta — não precisei escrever nenhum `useEffect`
  manual de limpeza.

### 3. Cards de benefício com ScrollTrigger + brilho no hover
**Arquivo novo:** `components/landing/Beneficios.tsx`
- Os 4 cards (antes dentro de `app/page.tsx`) também viraram um Client
  Component. Cada card aparece (fade + sobe de baixo) conforme entra na
  tela ao rolar a página, com um pequeno atraso entre um e outro
  (`stagger`). A animação só roda uma vez — `once: true` no
  `scrollTrigger` — não refaz se o usuário rolar pra cima e descer de novo.
- O brilho dourado no hover dos ícones **não usa GSAP** — é só CSS
  (`transition` + `drop-shadow` do Tailwind), porque é um efeito simples de
  hover; usar JavaScript pra isso seria mais pesado sem necessidade. Pra
  respeitar "movimento reduzido" mesmo sendo CSS puro, usei o prefixo
  `motion-safe:` do Tailwind (ele só aplica a classe quando o sistema
  **não** pediu movimento reduzido).

### 4. Poste do logo girando (só na landing page)
**Arquivos:** `components/ui/PosteBarbeiro.tsx`, `components/ui/Logo.tsx`
- O componente do poste ganhou uma prop `animado` (padrão `false`). Quando
  `true`, o GSAP desloca o padrão (`<pattern>`) das listras em loop
  infinito — como o padrão se repete a cada 16px, o deslocamento "dá a
  volta" de forma invisível, e o efeito é uma listra girando sem parar,
  andando na diagonal (igual a um poste de barbeiro de verdade). As
  "tampas" douradas do topo/base não se mexem, só as listras.
- `Logo` repassa essa prop pra `PosteBarbeiro`. **Só `app/page.tsx` passa
  `animado`** — nas outras páginas (login, painel, etc.) o poste continua
  parado, exatamente como antes.
- Esse componente virou Client Component (`"use client"`) porque precisa do
  `useGSAP`, mas isso não acontece à toa em todo o site: a animação em si
  só roda quando `animado={true}`, então nas páginas sem essa prop não há
  nenhum custo extra de animação, só o componente rodando no navegador em
  vez do servidor (diferença imperceptível, é um ícone pequeno).

### 5. Acessibilidade e performance
- Todas as animações do GSAP ficam dentro de
  `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", ...)`.
  Quem configurou o sistema pra reduzir movimento nunca vê a timeline ser
  criada — os elementos aparecem direto no estado final, sem nenhuma
  animação.
- Só anima `opacity`/`visibility` (via `autoAlpha`) e `transform`
  (`x`/`y`), que são baratos pro navegador (não recalculam layout). A única
  exceção é o giro do poste, que anima atributos de um `<pattern>` de SVG
  (não é `transform`/`opacity`, mas também não dispara reflow, porque um
  `<pattern>` dentro de `<defs>` não faz parte da árvore de layout).
- **Não consegui ver a animação rodando ao vivo** pela ferramenta de
  automação do navegador que uso aqui: a aba fica com
  `document.visibilityState: "hidden"` (ela não é a aba "visível" de
  verdade pro Chrome), e o GSAP depende de `requestAnimationFrame`, que o
  navegador não dispara pra abas nesse estado — então a timeline trava no
  meio. Conferi pelo DOM que os elementos certos são animados e que os
  estilos avançam corretamente enquanto roda (sem erro nenhum no console);
  só não deu pra ver o resultado final na tela. **Peço que você mesmo
  recarregue `http://localhost:3000` e confira se está tudo suave** — o
  `npm run dev` ficou rodando.

---

## Nova rodada — tipos reais, email de contato e templates (outubro de 2026)

### 1. Tipos do banco gerados de verdade pela CLI
**Arquivos:** `utils/supabase/database.types.ts`, `package.json`
- Você já tinha rodado `npx supabase login` neste computador, então desta vez
  deu pra gerar os tipos de verdade: `npx supabase gen types typescript
  --project-id bvspfjhcooygqfsgirnu`. Isso substitui o arquivo que antes era
  escrito à mão (rodadas anteriores não tinham como logar na CLI).
- A seção "Atalhos" no final do arquivo (`Tabelas`, `NovaLinha`,
  `AtualizacaoLinha`, `TipoEnum`) foi copiada de volta manualmente, porque
  ela não faz parte do que a CLI gera.
- Build rodou sem nenhum erro de tipo. Duas diferenças reais apareceram entre
  os tipos escritos à mão e o banco de verdade (documentadas em comentário
  dentro do próprio arquivo, pra você não perder o contexto):
  - A coluna `membros.papel` tem um **valor padrão direto no banco** que
    nenhuma migration versionada (001 a 004) registra — alguém deve ter
    adicionado isso manualmente pelo painel em algum momento. Não quebra
    nada (o código sempre informa o papel explicitamente ao inserir), mas é
    um "drift" entre as migrations versionadas e o banco real — se quiser,
    posso criar uma migration 005 só pra documentar esse default, me avise.
  - A função `buscar_barbearia_publica` aparece nos tipos gerados como
    retornando `telefone`/`endereco` **nunca nulos**, mas a coluna
    `barbearias.telefone`/`endereco` aceita `null`. É uma limitação conhecida
    do gerador para funções SQL com `returns table` (ele não analisa a
    consulta interna, só a assinatura da função). Conferi o uso no código
    (`app/b/[slug]/page.tsx`) e o `endereco` já é tratado como opcional
    (`{barbearia.endereco && ...}`), então não há bug na prática.
- Novo script **`npm run gen:types`** no `package.json`, pra você rodar
  sempre que mudar o banco (nova tabela, nova coluna, nova função).

### 2. Email de contato real
**Arquivos:** `app/termos/page.tsx`, `app/privacidade/page.tsx`, `components/Footer.tsx`
- Troquei `[EMAIL DE CONTATO]` por `contato.fluxobarber@gmail.com` (como
  link `mailto:`) nas duas páginas legais.
- Adicionei o mesmo email no rodapé do site inteiro, discreto, junto dos
  links de Termos/Privacidade.

### 3. Templates de email em português
**Pasta nova:** `supabase/templates/`
- Criei os 4 templates que o painel do Supabase pede (Confirm signup, Reset
  Password, Change Email Address, Magic Link), em português, no visual
  preto e dourado do site — HTML baseado em tabelas, estilos inline, sem
  fontes externas, com o link também disponível como texto puro (fallback
  caso o botão não renderize em algum cliente de email).
- **Ponto importante:** esses templates **não usam** o link padrão do
  Supabase (`{{ .ConfirmationURL }}`), porque esse link aponta direto pro
  servidor do Supabase, que confirmaria a conta sozinho, sem passar pela
  nossa rota `app/auth/confirm/route.ts`. Como essa rota já existe e faz
  questão de processar a confirmação ela mesma (chamando
  `supabase.auth.verifyOtp()` no servidor), os templates constroem o link na
  mão, com `token_hash` e `type` — expliquei isso em comentário no topo de
  cada arquivo `.html`, e tem um passo a passo completo (com os assuntos
  sugeridos) no `PENDENCIAS.md`.
- **Esses templates só funcionam depois de você colar cada um no painel** —
  ver `PENDENCIAS.md`, seção "Para fazer agora".

### 4. PENDENCIAS.md reorganizado
- Separado em três seções fixas: "✅ Concluído", "🔧 Para fazer agora" e
  "🚀 Pré-lançamento" — pra ficar claro o que já está resolvido e o que
  ainda falta, sem precisar reler o histórico inteiro.
- Corrigida a informação de que a migration 002 (agendamento público) ainda
  não tinha sido aplicada — ela já foi, há algumas rodadas.

---

## Nova rodada — melhorias (outubro de 2026)

**⚠️ Antes de testar: rode a migration 003** — veja
[PENDENCIAS.md](PENDENCIAS.md), seção "Rodar a migration 003 (PRIORIDADE)".
Sem ela, telefone/nome não são validados no banco (o site já valida, mas o
banco é a defesa final) e o bug da virada da meia-noite continua.

### 1. Migration 003 — padronização e correções no banco
**Commit:** `acddbb8` · **Arquivo:** `supabase/migrations/003_padronizacao_e_correcoes.sql`
- Telefone dos clientes passa a ser guardado **só com dígitos** (ex:
  `21990163583`, nunca `(21) 99016-3583`). Os telefones já cadastrados são
  normalizados automaticamente; se isso criar duplicata na mesma barbearia,
  a migration **para com uma mensagem explicando como resolver manualmente**
  (não mescla/apaga nada sozinha, por segurança).
- Constraint nova (`clientes_telefone_formato`) trava telefone fora do
  padrão (10 ou 11 dígitos) direto no banco.
- `criar_agendamento_publico` agora valida nome (2–100 caracteres) e
  telefone (10/11 dígitos), com mensagens em português.
- **Corrigido o bug da virada da meia-noite**: um atendimento perto da
  meia-noite (ex: 23:30 + 60min) não "passava" mais pela checagem de
  expediente por engano — a comparação agora usa data+hora completas, não
  só a hora.
- **Anti-spam**: um telefone não consegue ter mais de 3 agendamentos
  futuros (não cancelados) na mesma barbearia.
- **Como testar:** depois de rodar a migration no SQL Editor, tente agendar
  pela página pública (`/b/<slug>`) com um nome de 1 letra ou um telefone
  incompleto — deve recusar com mensagem clara. Tente agendar mais de 3
  vezes seguidas com o mesmo telefone — a 4ª deve ser recusada.

### 2. Telefone padronizado no site inteiro
**Commit:** `3ec45c8` · **Arquivos:** `utils/telefone.ts`, `utils/validacao.ts`
- `utils/telefone.ts` ganhou `normalizarTelefone` (só dígitos, mesma regra
  do banco), `telefoneTemFormatoValido`, e `aplicarMascaraTelefone` (formata
  **enquanto você digita**: `(21) 99016-3583`).
- Máscara aplicada no campo de telefone da Agenda (novo agendamento) e da
  página pública de agendamento. O card de agendamento já formatava o
  telefone pra exibição (sem mudança necessária aí).
- Validação no formulário, com as mesmas mensagens do banco, **antes** de
  enviar (nome 2–100 caracteres, telefone 10/11 dígitos).
- **Como testar:** em `/painel/agenda`, digite um telefone no campo "Telefone
  do cliente" — repare a máscara se formando enquanto digita. Tente enviar
  com um telefone incompleto.

### 3. Tipos gerados do banco
**Commit:** `bfa2f31` · **Arquivo:** `utils/supabase/database.types.ts`
- Não consegui rodar `supabase gen types` de verdade (precisa de
  `supabase login`, que abre o navegador — ver PENDENCIAS.md com o passo a
  passo pra você rodar). Escrevi o arquivo **no mesmo formato** que a CLI
  geraria, a partir do schema das migrations 001–003.
- Os dois clientes do Supabase (`utils/supabase/server.ts` e `client.ts`)
  agora usam esse tipo: `.from("tabela").select(...)` e `.rpc(...)` vêm com
  autocomplete e checagem de tipo no editor.
- Removi interfaces escritas à mão que duplicavam o formato das tabelas
  (`app/painel/agenda/tipos.ts`, `FormularioNovoAgendamento`,
  `FormularioAgendamentoPublico`, `FormularioConfiguracoes`,
  `utils/status-agendamento.ts`) — agora todas derivam do tipo gerado.
- Bônus: o `as unknown as` que existia em `app/painel/agenda/page.tsx` (pra
  "forçar" o TypeScript a aceitar o formato da consulta com relacionamentos)
  não é mais necessário — o tipo gerado já ensina o Supabase a inferir isso
  sozinho, pela chave estrangeira.

### 4. Termos de Uso, Política de Privacidade e LGPD
**Commit:** `713bc7b`
- `/termos` e `/privacidade`, com data de "última atualização" no topo.
  **São um modelo inicial — precisam de revisão de um advogado antes do
  lançamento comercial** (está anotado na própria página e no
  PENDENCIAS.md).
- Rodapé reutilizável (`components/Footer.tsx`): copyright com ano
  automático, links pras 2 páginas legais, e a assinatura "Desenvolvido por
  Fabrício Sobreira" (dourado, linka pro GitHub). Usado na landing, em
  login/cadastro (via `AuthCard`), termos, privacidade e na página pública
  `/b/[slug]`.
- Cadastro agora tem uma caixa obrigatória "Li e aceito os Termos de Uso e a
  Política de Privacidade" (valida no navegador **e** no servidor).
- Página pública de agendamento tem o texto "Ao agendar, você concorda com
  a Política de Privacidade" abaixo do botão.
- Procure por `[EMAIL DE CONTATO]` nas duas páginas legais e troque pelo
  email de contato real (anotado no PENDENCIAS.md).

### 5. Essenciais de um SaaS
**Commits:** `a40af08`, `9c3abb6`, `5f335b5`, `da5cbb3`
- **Esqueci minha senha**: link no login → `/esqueci-senha` (pede o email,
  sempre com a mesma mensagem de sucesso, mesmo se o email não existir —
  evita vazar quais emails têm conta) → `/redefinir-senha` (define a nova
  senha). Reaproveita a rota `/auth/confirm` que já existia.
- **Página 404** (`app/not-found.tsx`) e **página de erro**
  (`app/error.tsx`), preto e dourado, com botão de voltar ao início.
- **Loading states**: um `loading.tsx` com skeletons "piscando" em cada
  página do painel (Agenda, Barbeiros, Serviços, Horários, Configurações).
- **SEO**: title e description em toda página (incluindo o `/b/[slug]`
  dinâmico, com o nome da barbearia). Páginas do painel (área logada) têm
  `robots: noindex`, pra não aparecer em buscadores.
- **Imagem de compartilhamento (Open Graph)**: `app/opengraph-image.tsx`
  *gera* a imagem (preto/dourado, "Fluxo Barber") na hora, sem precisar de
  nenhum arquivo de design — aparece quando o link é compartilhado no
  WhatsApp.
- **Acessibilidade**: todo campo já tinha `<label>`; adicionei um contorno
  dourado visível em **qualquer** elemento focado pelo teclado
  (`:focus-visible` em `app/globals.css`), consistente em todo o site.
- **Revisão em 375px**: encontrei e corrigi uma quebra real — nos cards de
  Barbeiros e Serviços, um nome comprido (ex: "tesoura + barba +
  sombrancelha") empurrava os botões "Desativar"/"Apagar" pra fora do card.
  Os cards agora empilham verticalmente no celular e voltam a ficar lado a
  lado a partir de telas maiores (640px). Também ajustei o cabeçalho da
  landing page, que ficava apertado em 375px.

### 6. Rodapé
Ver item 4 acima — o rodapé já cobre todas as páginas pedidas (landing,
login, cadastro, termos, privacidade, página pública).

---

## O que foi feito, etapa por etapa

### Etapa 5 — Schema versionado
**Commit:** `919c0f6`
Copiei a estrutura do banco (que você já tinha criado no SQL Editor) para
`supabase/migrations/001_schema_inicial.sql`, só pra ficar no histórico do
git. Não precisa rodar nada — é cópia do que já existe.

### Etapa 6 — Identidade visual e landing page
**Commit:** `4a2e2cc`
- Paleta preto/dourado como tokens do Tailwind (`app/globals.css`).
- Fontes Playfair Display (títulos) e Inter (texto), via `next/font`.
- Componentes reutilizáveis em `components/ui/`: `Button`, `Input`, `Label`,
  `Card`, `Select`, `Badge`, `FormMessage`, `Logo`.
- Landing page (`app/page.tsx`) com apresentação, benefícios e botões
  "Criar conta" / "Entrar".
- Única dependência nova: `lucide-react` (ícones), como combinado.

### Etapa 7 — Autenticação (email e senha)
**Commit:** `75c83b6`
- `/cadastro` e `/login`, com Server Actions (`actions.ts` em cada pasta) e
  formulários client-side usando `useActionState`.
- Mensagens de erro do Supabase traduzidas pro português por **código**
  (não pelo texto em inglês, que pode mudar) — `utils/supabase/erros.ts`.
- `/auth/confirm`: rota que processa o link de confirmação de email e já
  loga o usuário.
- `BotaoSair`: componente de logout (Server Action) usado no painel.
- `proxy.ts` agora protege `/painel` e `/onboarding` — sem login, redireciona
  pra `/login?redirecionar=...` (e volta pra onde você tentou ir, depois de
  entrar).

### Etapa 8 — Onboarding (criar barbearia)
**Commit:** `18f0df5`
- `/onboarding` verifica se o usuário logado já é membro de alguma
  barbearia; se não for, mostra o formulário de criação.
- `utils/slug.ts`: gera o endereço da página pública a partir do nome (tira
  acento, deixa minúsculo, troca espaço por hífen), com campo editável.
- Chama a função `criar_barbearia` (já existe no seu banco) via `rpc`.
- Trata o erro de slug duplicado (dois "Barbearia do Zé" não podem ter o
  mesmo endereço).

### Etapa 9 — Layout do painel
**Commit:** `94699c2`
- `app/painel/layout.tsx`: descobre a barbearia do usuário e monta o menu.
- Menu lateral fixo no desktop, menu inferior no celular — Agenda,
  Barbeiros, Serviços, Horários, Configurações.
- Tela `/painel/configuracoes` (nome, telefone, endereço da barbearia +
  link pra página pública) — não tinha etapa numerada própria, mas era
  necessária pro menu não ter link quebrado.

### Etapa 10 — CRUD de Barbeiros
**Commit:** `4f1c469`
- `/painel/barbeiros`: cadastra barbeiro (só nome) e ativa/desativa.
- **Nunca apaga** um barbeiro — só desativa, pra não perder o histórico de
  agendamentos antigos que apontam pra ele.

### Etapa 11 — CRUD de Serviços
**Commit:** `5c872f7`
- `/painel/servicos`: cadastra serviço (nome, duração em minutos, preço em
  reais) e ativa/desativa, mesma lógica dos barbeiros.
- Preço digitado em reais (aceita vírgula, ex: `35,90`) é convertido pra
  centavos antes de salvar (`utils/dinheiro.ts`) — é assim que o banco
  guarda, pra nunca ter erro de arredondamento.

### Etapa 12 — Horários de trabalho
**Commit:** `41bb996`
- `/painel/horarios`: escolhe um barbeiro, vê os 7 dias da semana, cada um
  com os intervalos já cadastrados (pode ter mais de um por dia, ex:
  08:00–12:00 e 13:00–18:00) e um mini-formulário pra adicionar mais um.

### Etapa 13 — Agenda
**Commit:** `e087d2a`
- `/painel/agenda` (agora é a página inicial do painel): mostra o dia
  selecionado, com setas pra navegar entre dias, filtro por barbeiro, e a
  lista de agendamentos com Badge de status.
- Formulário de novo agendamento: digita o telefone do cliente (sugestão
  automática se já for cadastrado), nome (só se for cliente novo), escolhe
  serviço, barbeiro, data e hora.
- O fim do atendimento e o preço são calculados automaticamente a partir do
  serviço escolhido.
- Se o horário já estiver ocupado por outro agendamento desse barbeiro, o
  banco recusa (trava que já existia no seu schema) e a tela mostra: *"Esse
  barbeiro já tem um atendimento nesse horário."*
- Botões pra mudar o status: confirmar, concluir, cancelar, faltou.

### Etapa 14 — Página pública de agendamento
**Commit:** `0f030d3`
- `/b/<slug-da-barbearia>`: o cliente agenda sozinho, sem precisar de login.
- Como o RLS do banco bloqueia visitantes, criei 5 funções especiais em
  `supabase/migrations/002_agendamento_publico.sql` que expõem **só** o
  necessário (nome/telefone de outros clientes nunca aparecem).
- **Essa migration ainda precisa ser rodada por você** — veja a seção de
  pendências.

---

## Como testar cada parte no navegador

Rode o projeto primeiro:
```powershell
npm run dev
```
E abra `http://localhost:3000`.

1. **Landing page** — já abre direto, sem login. Confira o visual
   preto/dourado e os botões "Entrar" / "Criar conta".
2. **Cadastro** (`/cadastro`) — crie uma conta com um email e senha.
   - Se a confirmação de email estiver **ligada** (padrão do Supabase): você
     verá "enviamos um link de confirmação" — abra seu email, clique no
     link, e você será redirecionado já logado.
   - Se você **desligar** a confirmação (recomendado por enquanto — ver
     pendências): a conta já entra logada na hora.
3. **Onboarding** — depois do primeiro login, você cai na tela de criar a
   barbearia. Digite um nome e veja o endereço (`/b/...`) sendo gerado
   sozinho. Crie.
4. **Painel** — você cai em `/painel/agenda`, vazio. Teste o menu (lateral
   no desktop, embaixo no celular — redimensione a janela pra ver).
5. **Barbeiros** (`/painel/barbeiros`) — cadastre 1 ou 2 barbeiros.
6. **Serviços** (`/painel/servicos`) — cadastre um serviço (ex: "Corte",
   30 min, R$ 35,00).
7. **Horários** (`/painel/horarios`) — escolha o barbeiro, adicione um
   intervalo (ex: 08:00 às 18:00) em alguns dias da semana.
8. **Agenda** (`/painel/agenda`) — crie um agendamento de teste usando o
   barbeiro/serviço cadastrados. Tente criar dois no mesmo horário pro
   mesmo barbeiro: o segundo deve dar o erro de conflito. Teste os botões
   de status (Confirmar, Concluir, etc).
9. **Logout** — clique em "Sair" e confirme que `/painel` te manda de volta
   pro login.
10. **Página pública** (`/b/<slug-que-você-escolheu>`) — **só funciona
    depois de rodar a migration 002** (ver pendências). Depois disso, abra
    essa URL numa aba anônima (sem login) e tente agendar um horário dentro
    do expediente cadastrado.

---

## Pendências (o que fazer no Supabase)

As duas pendências que ficavam aqui (confirmação de email e rodar a
migration 002) **já foram resolvidas** em rodadas anteriores — URL
Configuration está feita e a migration 002 já rodou. A lista atualizada do
que falta (hoje, só colar os templates de email no painel) está sempre em
[PENDENCIAS.md](PENDENCIAS.md).

---

## Observação sobre `npm audit`

O `npm install` acusa 5 vulnerabilidades "high" — todas numa dependência de
desenvolvimento (`braces`, usada pelo `eslint-config-next` só durante o
lint, não vai pro site publicado). A correção automática (`npm audit fix
--force`) rebaixaria o `eslint-config-next` pra uma versão feita pro
Next.js 14, o que provavelmente quebraria o lint com o Next.js 16 — por
isso não rodei (e você pediu pra eu não usar `--force` mesmo). Não é
urgente, mas fica o registro.

## Sugestões de próximos passos

- **Editar/cancelar um agendamento já criado** além de só mudar o status
  (hoje dá pra cancelar, mas não pra mudar data/hora/serviço de um
  agendamento existente).
- **Confirmação por WhatsApp/SMS** quando o cliente agenda pela página
  pública — hoje não existe nenhum aviso automático pro cliente nem pra
  barbearia.
- **Página de "meus agendamentos"** pro cliente final ver/cancelar o que
  marcou (hoje, uma vez agendado, só a barbearia consegue ver/mudar).
- **Relatórios simples** no painel: quanto a barbearia faturou na semana,
  quantos atendimentos cada barbeiro fez.
- **Melhorar a tela de Configurações**: hoje só edita nome/telefone/
  endereço; poderia ter foto/logo da barbearia, horário de funcionamento
  geral (separado do horário por barbeiro), etc.
- **Testar em dispositivo móvel de verdade** (não só redimensionando o
  navegador) pra confirmar que o menu inferior e os formulários ficam
  confortáveis de usar com o dedo.
- Depois de testar tudo localmente, **fazer o primeiro deploy** (ex: Vercel)
  e repetir a configuração de Site URL / Redirect URLs do Supabase apontando
  pro domínio de produção.
