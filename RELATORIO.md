# Relatório — sessão autônoma (etapas 5 a 14)

Este arquivo resume tudo o que foi feito enquanto você estava fora, como
testar cada parte, o que ainda falta configurar no Supabase, e sugestões de
próximos passos.

**Veja sempre o [PENDENCIAS.md](PENDENCIAS.md)** para a lista atualizada do
que falta fazer no painel do Supabase — esse arquivo é reorganizado a cada
rodada em "Concluído", "Para fazer agora" e "Pré-lançamento".

---

## Nova rodada — barbearia de demonstração (outubro de 2026)

Criei `supabase/seeds/demo_barbearia.sql` — **não rodei em lugar nenhum**, é só
pra você revisar e colar no SQL Editor do Supabase quando quiser. Resumo do que
ele cria: 1 barbearia, 3 barbeiros, 8 serviços, horário terça-sábado, 120
clientes fictícios (nomes masculinos, já que é barbearia), e agendamentos dos
últimos ~30 dias + do **dia de hoje** (parte já passada, parte ainda por vir) +
dos próximos 5 dias (mais movimento sexta/sábado, como pedido). Cada cliente
tem um limite de visitas realista (a maioria 1 a 3 no período, uns 10 a 15
"fiéis" com 4 a 6, nunca mais que isso), e o "Corte Infantil" só é sorteado
pros 5 clientes marcados como pais. A barbearia fica no Rio de Janeiro (endereço fictício), e os telefones dos
clientes usam o prefixo fictício `2190000` + 4 dígitos sequenciais (DDD 21,
combinando com o endereço; nunca um número de verdade por acidente); o
telefone da PRÓPRIA barbearia já vem com o seu número de verdade, pra que o
botão "Falar com a barbearia" da página pública chegue em você. Todo o SQL está
comentado linha a linha, explicando o porquê de cada parte — os detalhes
técnicos (por que cada constraint é respeitada, como a geração evita
sobreposição de horário, etc.) estão nos comentários do próprio arquivo, pra
não duplicar aqui.

### As 3 sugestões de nome

O arquivo já vem com **"Barbearia Imperial"** (a 1ª opção), mas é só trocar a
primeira linha do `insert into barbearias` antes de rodar, se preferir outra:

1. **Barbearia Imperial** — soa confiante e "premium", combina com a
   identidade preto e dourado do próprio Fluxo Barber.
2. **Studio Barba & Navalha** — nome com cara de barbearia mais moderna,
   estilo "studio", pra um público mais jovem/descolado.
3. **Barbearia Vintage Club** — remete ao estilo clássico retrô que muitas
   barbearias usam hoje em dia, com um toque de "clube".

### Por que o seed NÃO cria o dono

De propósito: o dono precisa ser uma conta de verdade, com email e senha que
*você* escolhe e controla — não faz sentido o SQL inventar uma senha. Por
isso o arquivo cria a barbearia inteira (com todos os dados), mas a tabela
`membros` (que é quem liga um usuário logado a uma barbearia, como "dono")
fica vazia pra essa barbearia até você fazer esse último passo na mão.

### Como ligar a barbearia de demonstração à sua conta

1. **Crie uma conta pelo site**, em `/cadastro` (local ou no site publicado —
   use o email que quiser pra essa demonstração). **Não preencha o
   formulário de "Crie sua barbearia"** que aparece logo em seguida (o
   onboarding) — se você preencher esse formulário, ele cria uma barbearia
   **nova e diferente** da de demonstração, e a sua conta vira dona dela, não
   da "demo". Se isso acontecer sem querer, não tem problema: é só repetir o
   passo 3 abaixo mesmo assim (uma conta pode ser membro de mais de uma
   barbearia) e usar o painel normalmente pra apagar a barbearia extra depois,
   se não for mais usá-la.
2. **Ache o id dessa conta**, no SQL Editor do Supabase:
   ```sql
   select id, email from auth.users where email = 'o-email-que-voce-usou@exemplo.com';
   ```
3. **Ligue a conta à barbearia de demonstração como dona**, colando o id
   encontrado no passo 2 (este mesmo comando já está pronto, comentado, no
   final do `demo_barbearia.sql`):
   ```sql
   insert into membros (barbearia_id, user_id, papel)
   values (
     (select id from barbearias where slug = 'demo'),
     'cole-aqui-o-id-do-passo-2',
     'dono'
   );
   ```
4. **Entre no painel** (`/painel`, ou `/login` se já tinha saído) — a conta já
   cai direto na Agenda da "Barbearia Imperial" (ou o nome que você escolheu),
   com os barbeiros, serviços, horários e ~30 dias de agendamentos já
   preenchidos. Como ela já tem os 3 requisitos (barbeiro + serviço + horário
   ativos), o link público (`/b/demo`) já funciona de verdade, sem nenhum
   aviso de "ainda não está pronto" — ótimo pra mostrar a página pública
   funcionando numa demonstração ao vivo.

**Pra apagar a demonstração depois:** `delete from barbearias where slug =
'demo';` já leva tudo (barbeiros, serviços, horários, clientes, agendamentos
e o vínculo em `membros`) — a conta de login em si (`auth.users`) continua
existindo, seria apagada separadamente em Authentication → Users, se também
não quiser mais usá-la.

### Recriar a demo no dia de cada apresentação

O seed gera os agendamentos **relativos a "hoje"** (a data em que você roda o
SQL Editor): "últimos 30 dias", "hoje" e "próximos 5 dias" são sempre
calculados a partir do momento da execução. Ou seja, se você rodar o arquivo
de novo bem antes de uma apresentação, a janela toda se desloca sozinha —
você não precisa editar nenhuma data na mão. Pra recriar a demo "fresca" no
dia de uma apresentação, rode estes 2 comandos **nessa ordem**, no SQL Editor:

1. Apagar a demonstração antiga:
   ```sql
   delete from barbearias where slug = 'demo';
   ```
2. Colar e rodar o conteúdo inteiro de `supabase/seeds/demo_barbearia.sql` de novo
   (ele recria tudo do zero, já com a janela de datas atualizada pro dia atual).

**⚠️ Atenção:** o `delete` do passo 1 usa `on delete cascade`, então ele apaga
**também** o vínculo em `membros` — ou seja, depois de recriar a demo, a sua
conta deixa de ser "dona" dela até você religar esse vínculo de novo. Duas
formas de resolver isso:

- **Repetir o passo 3** da seção anterior ("Como ligar a barbearia de
  demonstração à sua conta"), buscando o id da sua conta de novo e colando no
  `insert into membros`; ou
- **Usar o atalho já pronto** no final do próprio `demo_barbearia.sql`: há um
  bloco comentado que já faz o `insert into membros` buscando o id da sua
  conta diretamente pelo email (sem precisar copiar/colar nenhum id na mão).
  Basta descomentar esse bloco, trocar `'SEU_EMAIL_AQUI'` pelo email de
  verdade da sua conta, e rodar — fica pronto pra usar em toda recriação
  futura, sem repetir o passo a passo manual.

---

## Nova rodada — evita o "link compartilhado cedo demais" (outubro de 2026)

Você relatou um problema real de experiência: nada impedia o dono de compartilhar o
link antes de cadastrar barbeiro, serviço e horário — e aí o cliente caía numa página
sem agendamento nenhum disponível. Resolvido com as 4 camadas pedidas, numa única
regra central, usada em todo lugar.

### A função central

`utils/supabase/prontidao.ts`, `barbeariaProntaParaAgendamentos(supabase, barbeariaId)`
— os 3 requisitos, e só eles: pelo menos 1 barbeiro ativo, 1 serviço ativo, e 1
horário de trabalho cadastrado pra um barbeiro que esteja ativo AGORA (um horário de
um barbeiro desativado não ajuda em nada). Devolve os 3 booleanos individuais (pra o
checklist) + a lista do que falta, cada item já com o link da tela onde se resolve.
Essa MESMA função (não uma parecida, a mesma) é chamada em: card "Seu link" (Agenda e
Configurações), aviso antes de compartilhar, checklist, tour, e assistente de
configuração rápida. A página pública (sem login) usa o equivalente em SQL — ver
"migration 005" mais abaixo — mas é a mesma regra, só reescrita pra rodar sem sessão.

### 1 — Selo de status no card "Seu link"

Badge verde "Pronto para receber agendamentos" ou âmbar "Ainda não está pronto"
(componente `Badge` que já existia, variantes `sucesso`/`aviso`). Quando não está
pronto, aparece logo abaixo "Falta: cadastrar um serviço · definir os horários",
cada trecho já é um link pra tela certa.

### 2 — Aviso ao compartilhar cedo demais

Os botões "Copiar link" e "Compartilhar no WhatsApp" (esse último virou `<button>`,
antes era um `<a href>` — precisava poder interceptar o clique antes de abrir o link)
agora checam `status.pronta` antes de agir. Se não está pronto, abre um modal (GSAP:
fade + leve deslize/escala, respeitando `prefers-reduced-motion`) com a mensagem,
"Completar agora" (leva pro primeiro item que falta) e "Compartilhar mesmo assim"
(faz a ação original). Pronto, os botões agem direto, sem interromper nada.

### 3 — Checklist em 2 grupos

"Obrigatório para receber agendamentos" (barbeiro/serviço/horário, com "Seu link só
funciona depois desses 3 passos.") e "Próximos passos" (copiar/compartilhar o link,
receber o 1º agendamento). O "feito" dos 3 itens obrigatórios agora vem DIRETO do
`status` central (antes era uma contagem separada, que não considerava se o
barbeiro/serviço estava ativo) — nunca mais os dois lugares podem discordar sobre se
o link funciona. "Receber o primeiro agendamento" perdeu o botão "Resolver" (não é
algo que se resolve com um clique) e ganhou uma dica no lugar: "Compartilhe seu link
para receber o primeiro."

### 4 — Assistente de configuração rápida (a solução principal)

Entre criar a barbearia (onboarding) e o tour, uma nova etapa:
`/onboarding/configuracao-rapida`. 3 passos curtos, "Pular e configurar depois"
sempre visível, barra de progresso e as trocas de etapa animadas com GSAP (fade +
leve deslize, `prefers-reduced-motion` respeitado):

1. **"Quem atende na sua barbearia?"** — campos de nome (mais de um, com
   "+ Adicionar outro"), e o atalho "Eu mesmo atendo", que preenche com um nome
   sugerido a partir do email do usuário (`utils/nome-usuario.ts`) — hoje o cadastro
   não pede nome nenhum, então essa é a única pista disponível; o campo continua 100%
   editável, então uma sugestão imperfeita não atrapalha.
2. **"Quais serviços você oferece?"** — 3 chips de sugestão (Corte 30min, Barba
   30min, Corte + Barba 60min), clicáveis, viram uma linha editável (nome, duração,
   **preço obrigatório, nunca sugerido**) + "+ Adicionar outro" pra um serviço
   personalizado.
3. **"Quando vocês atendem?"** — segunda a sábado, 09:00–19:00 sugeridos (editável),
   aplicado a TODOS os barbeiros da etapa 1.

Nada é salvo no banco até o botão "Concluir", no final da etapa 3 — isso faz "pular"
e "chegar ao fim sem preencher nada" se comportarem exatamente igual (nenhum dado
criado), sem precisar de um caso especial pra cada um. A Server Action
(`concluirConfiguracaoRapida`) ignora linhas em branco (barbeiro sem nome, serviço
sem preço) uma a uma — uma etapa "pulada no meio" não quebra as outras.
**A tela final só diz "Pronto! Seu link já aceita agendamentos" depois de conferir de
verdade** (chama `barbeariaProntaParaAgendamentos` de novo, com os dados recém-criados)
— se faltou algo (ex: só cadastrou barbeiro, sem serviço), mostra "Quase lá!" em vez
de mentir.

### 5 — Tour ajustado

O passo do link (passo 5) agora recebe o `status` como prop; se `!status.pronta`, o
texto do balão muda pra avisar: "Atenção: o link só funciona depois de cadastrar
barbeiro, serviço e horários." Mesma fonte de verdade de novo — nunca um texto
"tudo certo" quando não está.

### 6 — Página pública mais acolhedora

Troquei "Essa barbearia ainda não está com agendamento online disponível" (que soava
a erro) por "[Nome] está finalizando a agenda online. Volte em breve!", com um botão
"Falar com a barbearia" (WhatsApp, usando o telefone já cadastrado) quando a
barbearia tem telefone — some sozinho quando não tem, sem expor nada a mais.

**Migration nova, AINDA NÃO RODADA** (`supabase/migrations/005_barbearia_pronta_publica.sql`,
ver `PENDENCIAS.md`): função `barbearia_esta_pronta(p_slug)`, a versão em SQL (security
definer) da mesma regra central, pra a página pública saber se pode oferecer
agendamento sem expor nenhum dado além de um booleano. **Até você rodar essa
migration, a página pública sempre vai mostrar a mensagem "ainda não pronta", mesmo
pras barbearias que já estão prontas de verdade** — o código já trata a chamada RPC
que falha (função inexistente) como "não", por segurança, então nada quebra, só fica
mais conservador que o necessário até a migration rodar.

### Como testei

Criei uma 2ª conta de teste (`teste.configrapida@fluxobarber.test`, ver
`PENDENCIAS.md` pra apagar as duas) e testei de ponta a ponta, clicando de verdade:
cadastro → onboarding → assistente de configuração rápida completo (1 barbeiro via
"Eu mesmo atendo", Corte + Barba com preço, horário padrão) → tela final "Pronto!" →
Agenda com selo verde → passo 5 do tour sem aviso (porque já está pronta) → página
pública (mostra "não pronta" só porque a migration 005 ainda não rodou, como
esperado). Depois, voltei pra conta de teste da rodada anterior (incompleta de
propósito) e confirmei: selo âmbar com "Falta: cadastrar um serviço · definir os
horários"; clicar em "Copiar link" abre o aviso, com o texto certo; página pública
dela mostra a mensagem acolhedora (sem botão de WhatsApp, porque essa barbearia não
tem telefone cadastrado). Testei em 375px (técnica de sempre, `<iframe>` com largura
fixa) em todas as telas novas — sem rolagem horizontal em nenhuma.

**Sobre ver as animações rodando:** mesma limitação de sempre (aba em segundo plano
nesta ferramenta — o GSAP trava no meio de qualquer tween, incluindo o fade do modal
de aviso e as transições entre etapas do assistente). Confirmei o conteúdo real por
baixo do `visibility: hidden` que o GSAP deixa preso (via `textContent`, que ignora
visibilidade, em vez de `innerText`/screenshot) — tudo certo, é só a ferramenta.

---

## Nova rodada — ajustes na landing page + tutorial de boas-vindas (outubro de 2026)

Rodada com 2 partes grandes: ajustes na landing page (Parte A) e o tutorial guiado do
painel (Parte B). Cada parte teve seu próprio commit.

### Parte A — ajustes na landing page

**Arquivos alterados:** `components/landing/Hero.tsx`, `components/landing/Beneficios.tsx`,
`components/landing/ComoFunciona.tsx`, `components/landing/ChamadaFinal.tsx`,
`components/ui/Destaque.tsx`
**Arquivo novo:** `components/landing/IndicadorRolar.tsx`

#### A1 — "Como funciona" (na verdade, os cards) visível sem rolar

**Escolhi reduzir o espaço vertical do hero, sem reordenar as seções.** Pensei nas duas opções
que você deu: mover "Como funciona" pra antes dos cards quebraria a lógica de venda (primeiro
mostra o BENEFÍCIO pro dono, só depois explica o passo a passo — inverter isso enfraquece o
argumento de venda, sem ganhar nada em "conteúdo visível", já que o que importa é só a ALTURA do
hero, não a ordem das seções depois dele). Então:
- `pt`/`pb` do hero caíram de `pt-16 md:pt-24 pb-8 md:pb-10` pra `pt-10 md:pt-14 pb-6 md:pb-8`.
- O subtítulo ficou mais curto (ver A3), o que também ajudou a reduzir a altura.
- Conferi (forçando o estado final, via `<iframe>` de largura E altura fixas — a mesma técnica
  de rodadas anteriores, agora também controlando a altura) que o topo da seção de cards aparece
  bem dentro da tela, sem rolar, nas 4 resoluções pedidas: a 383px do topo em notebook/desktop
  (1366×768, 1440×900 e 1920×1080 — sobra bastante espaço pra "pré-visualizar" os cards) e a
  531px no celular (390×844).
- **Seta de "role para baixo":** `IndicadorRolar.tsx`, novo componente. Flutua devagar (GSAP,
  `yoyo` infinito) e some com um fade rápido assim que `window.scrollY` passa de 24px. Com
  movimento reduzido, ela fica parada (só a parte do "flutuar" é bloqueada pelo
  `prefers-reduced-motion`; o sumiço ao rolar não é "movimento animado", é só reação a uma ação
  do próprio usuário, então não me pareceu precisar entrar nessa regra).

#### A2 — brilho da palavra "barbearias" removido

Eu tinha colocado um brilho (uma faixa clara, inclinada, deslizando por cima da palavra) na
rodada anterior. Você reportou que aparecia um retângulo cinza/prateado — o recorte
(`overflow-hidden`) do span pai não acompanhava bem a INCLINAÇÃO (`skew`) do brilho, deixando as
bordas da faixa visíveis em vez de um brilho suave. Em vez de tentar consertar o recorte, **tirei
o efeito inteiro**, como você sugeriu na dúvida: "barbearias" agora é só a última palavra do
título, estática, em dourado (`#C9A227`), no mesmo fluxo `inline-flex` das outras 3 — sem
`overflow-hidden`, sem `position: relative`, sem elemento decorativo extra. Mais simples e sem
risco de recriar o bug.

#### A3 — subtítulo novo, mais curto

Troquei pelo texto sugerido (com pequenos ajustes de pontuação), com os 4 destaques pedidos:
"**Automatize sua agenda** e leve sua barbearia a outro nível: seus clientes **agendam
sozinhos**, **24 horas por dia**, e você foca no que **gera lucro**." Testei a largura máxima do
parágrafo até caber em no máximo 2 linhas nas telas de desktop (ficou em `max-w-3xl`, testado via
`iframe` nas 3 resoluções maiores — sempre 2 linhas).

#### A4 — 6 cards de benefício (3 colunas no desktop)

Grade passou de `md:grid-cols-2 lg:grid-cols-4` pra `md:grid-cols-2 lg:grid-cols-3` (3 no
desktop, 2 no tablet, 1 no celular). Os 2 cards novos, como pedido: "Mais tempo, mais lucro"
(ícone `TrendingUp`) e "Barbearia de alto padrão" (ícone `Crown`). Revisei o card "Equipe
organizada": o destaque "tudo **num** só lugar" virou "tudo **em um** só lugar" (ver regra de
copy sobre evitar "num/numa" — era o único lugar da página que ainda usava). Nenhum card (novo ou
revisado) menciona número, porcentagem, estatística ou depoimento — só a lógica do benefício.

#### A5 — bug da vírgula no `<Destaque>`

**Causa real:** o componente `Destaque` estava como `inline-block` (eu tinha feito isso de
propósito, numa rodada anterior, pra um efeito de "pop" com `scale` no GSAP). Só que um
`inline-block` vira uma caixa "atômica" pro navegador, e existe uma regra de quebra de linha que
permite quebrar logo DEPOIS dessa caixa, mesmo sem espaço nenhum no texto — foi isso que fazia a
vírgula (ou o ponto) colada em seguida "escapar" sozinha pra linha de baixo, mesmo grudada no
JSX sem espaço nenhum.
**Correção:** `Destaque` voltou a ser `inline` puro (o padrão de um `<strong>`). Como
`transform` não tem efeito em elementos `inline`, o realce com `scale` no subtítulo do hero
(Parte 3 da rodada anterior) teve que mudar — agora é só um fade de opacidade (de 35% até 100%),
sem `scale`/`y`. Conferi TODOS os destaques da página (subtítulo do hero + 6 cards) com um script
que compara, pra cada `<strong>` seguido de pontuação colada, se a pontuação renderiza na MESMA
linha que o fim do destaque — zero problemas encontrados, em 1366/768/390px.

#### A6 — cor nos títulos das seções

"Como funciona" virou "Sua barbearia pronta em **3 passos**" (mais vendedor, como você sugeriu,
com "3 passos" em dourado via `<Destaque>`). A chamada final ganhou o destaque em "**perder
tempo**", e o texto de apoio abaixo dela mudou pra "Crie sua conta gratuita, automatize sua
agenda e ganhe tempo pro que realmente gera lucro." — mesmo tom de lucro do subtítulo do topo,
fechando a página com a mesma mensagem.

#### A7 — validação

Testei via `<iframe>` de largura E altura fixas (375, 768, 1366, 1440, 1920px de largura — a
técnica mais confiável que encontrei, já que minha ferramenta de navegador não redimensiona a
janela de verdade, explicado em rodadas anteriores): sem rolagem horizontal em nenhuma; os 6
cards com a mesma altura dentro de cada linha; nenhuma pontuação "órfã"; início da seção de
benefícios sempre visível sem rolar, nas 4 resoluções do pedido original. Como todas as
animações desta parte continuam com `clearProps` e dentro do
`prefers-reduced-motion: no-preference`, o estado estático (movimento reduzido) continua
idêntico ao estado final animado, pelo mesmo motivo já validado nas rodadas anteriores.

### Parte B — tutorial de boas-vindas

**Arquivos novos:** `utils/origem-site.ts`, `utils/supabase/metadados-usuario.ts`,
`components/painel/acoes-progresso.ts`, `components/ui/EstadoVazio.tsx`,
`components/painel/LinkBarbearia.tsx`, `components/painel/Tour.tsx`,
`components/painel/ChecklistPrimeirosPassos.tsx`
**Arquivos alterados:** `utils/supabase/barbearia-atual.ts`, `components/painel/PainelShell.tsx`,
`app/painel/agenda/page.tsx`, `app/painel/configuracoes/page.tsx` (+ `FormularioConfiguracoes.tsx`),
`app/painel/horarios/page.tsx`, `app/painel/barbeiros/page.tsx`, `app/painel/servicos/page.tsx`

#### B1 — card "Seu link"

`LinkBarbearia.tsx`: mostra a URL completa (montada com `utils/origem-site.ts`, que lê o domínio
da própria requisição — nunca escrito na mão — então funciona igual no `localhost` e no site
publicado), com "Copiar link" (feedback "Link copiado!" por 2s), "Compartilhar no WhatsApp"
(`wa.me` com a mensagem já pronta) e "Abrir minha página". Fica no topo da Agenda e também em
Configurações (que perdeu o link simples "Endereço público" que tinha antes — virou redundante).

#### B2 — tour guiado

`Tour.tsx` — a peça mais grande desta rodada, sem nenhuma biblioteca de tour pronta. Alguns
detalhes de implementação que valem registrar:
- **O "recorte" na tela escura** não é 1 elemento com buraco — são 4 `<div>`s escuros (acima,
  abaixo, à esquerda e à direita do elemento em foco) mais um anel dourado decorativo. Assim o
  clique passa limpo por cima do elemento destacado, mas continua bloqueado em qualquer outro
  lugar da tela — sem precisar de CSS `clip-path` com buraco (mais difícil de acertar com
  cantos arredondados) nem de nenhuma lib extra.
- **Os passos 2, 3 e 4** (Barbeiros/Serviços/Horários) apontam pro `data-tour="menu-..."` dos
  itens de menu, que agora existem TANTO no menu lateral (desktop) quanto no menu inferior
  (celular) — o tour acha qual dos dois está de fato visível (`getClientRects().length > 0`,
  um jeito barato de detectar "display: none") e destaca esse. Testei isso de verdade: numa
  tela de 375px, confirmei que é o item do menu inferior que é encontrado, não o da barra
  lateral (que nessa largura fica escondida).
- **Posição do balão**: calculada tentando os 4 lados (direita, esquerda, baixo, cima) e
  escolhendo o que tem mais espaço livre na tela — sempre preso dentro da viewport. Pra o menu
  lateral (bastante espaço à direita), o balão aparece à direita; pro menu inferior do celular
  (bastante espaço só em cima), aparece em cima — exatamente o comportamento pedido, sem
  precisar de regra específica pra mobile: é consequência do mesmo cálculo genérico.
- **Only transform/opacity + `prefers-reduced-motion`**: igual às animações da landing — o
  recorte desliza (`top/left/width/height` tweenados, que viram só `transform`/sizing puro em
  elementos sem padding) e o balão entra com fade + deslize (`autoAlpha`/`y`), tudo dentro de
  `gsap.matchMedia`. Com movimento reduzido, tudo pula direto pro estado final.
- **Acessibilidade**: `role="dialog"` + `aria-modal`, Esc fecha, setas ←/→ voltam/avançam, Tab
  fica preso dentro do balão (cicla entre os botões, não escapa pro resto da página).
- **Guardado nos metadados do usuário** (`supabase.auth.updateUser`), sem nenhuma tabela nova:
  `tour_visto` (nunca mais aparece sozinho depois disso) e, em Configurações, um link "Ver
  tutorial novamente" que zera essa flag e manda de volta pra Agenda. Como `updateUser()` tem
  pelo menos um relato de SUBSTITUIR os metadados em vez de mesclar (dependendo da versão/SDK),
  `utils/supabase/metadados-usuario.ts` sempre lê o usuário de novo e mescla na mão antes de
  salvar — nunca corre o risco de apagar outro campo sem querer.
- **Celebração final**: ao concluir o último passo, uma telinha com o ícone `PartyPopper`
  "estourando" (GSAP, `back.out`) e a mensagem combinada, fechando sozinha depois de ~2s.

#### B3 — checklist "Primeiros passos"

`ChecklistPrimeirosPassos.tsx`, no topo da Agenda. Cada item é calculado a partir de uma consulta
real ao banco (quantidade de barbeiros/serviços/horários/agendamentos daquela barbearia — todas
em paralelo, via `Promise.all`, pra não encadear uma consulta atrás da outra) — nunca marcado "na
mão". O item do link usa o mesmo metadado `link_compartilhado` do B1 (marcado ao clicar em Copiar
ou WhatsApp). Barra de progresso em CSS puro (`width` com transição) — não precisava de GSAP pra
uma barra que só cresce da esquerda pra direita. Quando tudo está completo, mostra os parabéns e
o botão "Esconder" (guardado como `checklist_escondido`, mesmo mecanismo dos metadados).

#### B4 — estados vazios

`EstadoVazio.tsx`: ícone + título + descrição, com um botão de ação OPCIONAL — só adicionei o
botão onde a ação de verdade fica em OUTRA tela (Horários, quando não há nenhum barbeiro: botão
leva pra Barbeiros). Em Barbeiros/Serviços/Agenda, o formulário de cadastro já está bem ali na
mesma tela, então o estado vazio ali é só ícone + mensagem, sem duplicar um botão pro que já está
visível.

#### B5 — como testar (e como eu testei)

Criei a conta de teste pedida (`teste.tutorial@fluxobarber.test`, ver `PENDENCIAS.md` pra
apagar) e testei o fluxo de ponta a ponta de verdade, clicando/navegando (não só lendo o
código): cadastro → onboarding → Agenda mostrando o card do link, o checklist (0 de 5) e o tour
abrindo sozinho no passo 1, com o nome da barbearia certo na frase de boas-vindas; avancei pro
passo 2 e conferi o recorte dourado exatamente em volta do item "Barbeiros" do menu; pulei o
tour e recarreguei a página — ele não voltou a aparecer sozinho; fui em Configurações, cliquei
"Ver tutorial novamente" — voltou pra Agenda com o tour do passo 1 de novo; cadastrei um
barbeiro de teste e voltei pra Agenda — o checklist atualizou sozinho pra "1 de 5", o item
corresponde riscado; cliquei "Copiar link" — foi pra "2 de 5"; conferi os estados vazios de
Barbeiros (antes de cadastrar) e da Agenda (sem agendamento no dia) — ícone, título e descrição
certos; testei em 375px (via `<iframe>`, mesma técnica de sempre) — o tour acha o item certo do
menu inferior, sem rolagem horizontal.

**Pra você testar:** crie uma conta nova em `/cadastro` (local ou publicado — com a confirmação
de email desligada, ela já nasce logada), crie uma barbearia no onboarding, e o tour deve abrir
sozinho assim que a Agenda carregar. Teste pular, teste "Ver tutorial novamente" em
Configurações, e vá cadastrando barbeiro/serviço/horário/agendamento aos poucos pra ver o
checklist marcar cada item sozinho.

**Sobre ver as animações rodando:** continuo sem conseguir, pelo mesmo motivo de sempre (aba em
segundo plano nesta ferramenta — o GSAP trava no meio de qualquer tween). Dessa vez isso causou
um efeito "em cascata" interessante de se explicar: como o `clearProps` de um passo nunca chega a
rodar (porque a animação nunca termina de verdade), o próximo passo "herda" um resquício de
transform do passo anterior, e o balão aparece visualmente deslocado nos prints que tirei. Conferi
que isso é só da ferramenta e não um bug de verdade: extraí a posição (`top`/`left`) que o React
calculou e bate exatamente com a fórmula esperada (testei com os números de verdade da tela) — o
deslocamento visual nos prints vem só do `transform` "preso" por cima, que em um navegador de
verdade (aba em primeiro plano, `requestAnimationFrame` rodando normal) nunca chega a acontecer,
porque cada tween tem menos de 1 segundo e sempre termina antes do próximo passo começar.

---

## Nova rodada — correção dos bugs visuais da landing page (outubro de 2026)

Você testou a rodada anterior e encontrou 6 bugs visuais, mais um pedido de revisão geral de
alinhamento/espaçamento. Corrigi tudo num commit só (não dava pra separar em partes como da última
vez — os bugs se sobrepõem nos mesmos arquivos).

**Arquivos alterados:** `components/landing/Hero.tsx`, `components/landing/Beneficios.tsx`,
`components/landing/ComoFunciona.tsx`, `components/landing/ChamadaFinal.tsx`, `app/page.tsx`

### 1. Título sem espaços ("Agendamentosimplespara barbearias")
A causa: eu colocava o espaço como texto DENTRO de cada `<span>` de palavra (`{palavra}{" "}`) —
isso esbarra num detalhe de CSS pouco conhecido: espaço em branco bem no FINAL de uma caixa
`inline-block` pode ser descartado pelo navegador (ele é tratado como "fim de linha", que some).
**Correção:** troquei pra um `<span>` em `inline-flex` com `gap-x-[0.28em]` entre as palavras — um
espaçamento de verdade, via layout, que nunca depende de caractere de texto nem pode ser descartado.
**Acessibilidade:** o `<h1>` ganhou `aria-label="Agendamento simples para barbearias"` (a frase
inteira, de uma vez) e o conteúdo visual (as palavras separadas pra animar) ganhou `aria-hidden` —
assim o leitor de tela lê a frase normal, em vez de tentar ler cada `<span>` struct separado.

### 2. "barbearias" desalinhada (mais alta que as outras palavras)
A causa: a palavra em destaque tem `overflow-hidden` (preciso disso pra recortar o brilho que passa
por cima dela) — só que, por uma regra específica de CSS, um `inline-block` com `overflow` diferente
de `visible` deixa de se alinhar pela BASE DO TEXTO e passa a se alinhar pela base da própria caixa.
Como só essa palavra tinha `overflow-hidden`, só ela ficava deslocada. **Correção:** troquei o
alinhamento das palavras de "base de texto" (`inline-block` dentro de texto corrido) pra
`items-center` dentro do `inline-flex` do ponto 1 — isso não depende de baseline nenhuma, então o
`overflow-hidden` deixou de causar qualquer diferença.

### 3. Cards em alturas e posições diferentes depois da animação
Duas causas, corrigidas as duas:
- A animação de entrada não tinha `clearProps`, então o GSAP podia deixar resíduo de `transform`/
  `opacity` no estilo inline depois de terminar. Adicionei `clearProps: "all"` — ao terminar, o GSAP
  agora APAGA esse estilo inline e devolve o controle 100% pro CSS (`y: 0`, `scale: 1`, `opacity: 1`
  "de verdade", não só numericamente parecido).
- Os 4 cards não tinham garantia de altura igual. Adicionei `items-stretch` explícito na grade e
  `h-full flex flex-col` em cada card — agora todos os cards de uma mesma linha ficam com a mesma
  altura (conferido: 230px os 4, lado a lado, em telas largas), com o conteúdo alinhado ao topo.
  **Nota:** no celular (1 coluna), é esperado que os cards tenham alturas diferentes entre si — cada
  um é a única coisa na própria linha, então a altura segue o tamanho do texto de cada descrição;
  isso não é bug, só não se aplica "mesma altura" quando não há mais de 1 card por linha.
- Apliquei o mesmo `clearProps: "all"` nos números do "Como funciona" e na linha dourada, pelo mesmo
  motivo (consistência e segurança).

### 4. Rolagem horizontal em algumas larguras
Adicionei `overflow-x-hidden` no `<main>` da landing page (`app/page.tsx`) — só nessa página, não no
`<body>` inteiro (pra não arriscar quebrar nada em outras páginas) — como rede de segurança contra
qualquer sobra de pixel que uma animação (deslize/escala) empurre pra fora da tela. Como isso só
mexe no eixo X, não afeta o scroll vertical nem o ScrollTrigger (que só olham pro eixo Y). Testei nas
4 larguras pedidas (375, 768, 1280, 1440px) e não há rolagem horizontal em nenhuma.

### 5. Números do "Como funciona" na fonte errada
Trocei a fonte dos números de 1/2/3 de `font-display` (Playfair — fonte de título, com algarismos de
alturas variadas) pra `font-sans` (Inter — fonte de texto) com `tabular-nums` (todos os algarismos
com a mesma largura) e `leading-none` (sem sobra de altura de linha empurrando o número pro lado).

### 6. Palavra sozinha na última linha
Adicionei `text-balance` no `<h1>`, no subtítulo do hero, e nos títulos ("Como funciona" e na
chamada final); e `text-pretty` nos parágrafos dos cards de benefício — são as duas utilidades do
Tailwind pra `text-wrap: balance` e `text-wrap: pretty`.

### Bug extra que encontrei ao validar o "prefers-reduced-motion" (não estava na sua lista)
Com movimento reduzido ativado, a timeline do GSAP nunca é criada — e o brilho do título (que recorta
e desliza por cima da palavra "barbearias") não tinha nenhuma posição de descanso definida em CSS
puro. Resultado: pra quem pede movimento reduzido, a faixa clara do brilho ficaria **parada bem em
cima da palavra**, pra sempre, em vez de nunca aparecer. Corrigi adicionando `-translate-x-[150%]`
como classe Tailwind estática (a posição "fora da tela", por CSS, sem depender do GSAP rodar).

### Revisão geral de alinhamento e espaçamento
- Todas as seções (cards, "Como funciona", chamada final) passaram a usar o mesmo ritmo vertical
  (`py-16 md:py-20`) e a mesma largura máxima/alinhamento (`mx-auto max-w-6xl`).
- O hero ficou com menos espaço embaixo (`pb-8 md:pb-10`, em vez do mesmo `py-16 md:py-24` de cima
  pra baixo) — o vazio entre os botões e os cards diminuiu bastante.
- Os 3 passos do "Como funciona" já ficavam alinhados entre si (os círculos sempre no topo da coluna,
  o texto centralizado embaixo) — conferi e não precisou mudar nada aí além da fonte dos números.

### Como validei (sem conseguir ver a animação rodando ao vivo)
Como a ferramenta de navegador que uso continua sem conseguir reproduzir a animação (a aba fica em
segundo plano, o `requestAnimationFrame` do GSAP não dispara), usei a abordagem que você sugeriu,
adaptada: em vez de chamar `timeline.progress(1)` (o GSAP não fica exposto em `window` no bundle),
simulei o **estado final de verdade** removendo o `style` inline de cada elemento animado via
JavaScript — que é exatamente o que o `clearProps: "all"` novo faz de verdade quando a animação
termina. Carreguei a página dentro de um `<iframe>` com largura fixa (375, 768, 1280 e 1440px — como
minha ferramenta não consegue redimensionar a janela de verdade, isso simula cada largura porque as
media queries do Tailwind reagem à largura do iframe) e conferi, em cada uma: nenhuma rolagem
horizontal: espaço entre as palavras do título (17px, igual nas 4 palavras, em telas largas);
topo de cada palavra do título na mesma altura (inclusive "barbearias"); altura dos cards igual
dentro de cada linha (230px os 4, em telas largas; 210/210 e 190/190 nas duas linhas de 2 colunas,
em tablet); fonte dos números = Inter. Também recriei a estrutura do brilho do título isolada (sem
GSAP) pra confirmar que a posição de descanso por CSS realmente fica fora da área visível da palavra.

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
