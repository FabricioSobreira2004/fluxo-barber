import { TriangleAlert } from "lucide-react"; // mesmo ícone de atenção usado no aviso de "link incompleto" (ver LinkBarbearia.tsx)

interface PropriedadesAlertaSpam { // o único dado variável: pra qual email o link foi mandado
  email?: string; // opcional só por segurança de tipos (ver app/cadastro/actions.ts); na prática está sempre preenchido
}

// alerta compartilhado entre /cadastro (tela "Conta criada!") e /login (erro "email não confirmado") --
// os 2 lugares onde a pessoa pode estar esperando um email de confirmação que caiu no spam. Precisa ser
// bem visível (cor âmbar, caixa com borda e fundo, não um texto discreto) porque, enquanto o remetente for
// o SMTP do Gmail (ver PENDENCIAS.md), cair no spam é o motivo nº 1 de "o link não funciona" -- e o Gmail
// desativa de propósito os links de email marcado como spam, então só "ver o email" não basta.
export function AlertaSpam({ email }: PropriedadesAlertaSpam) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2.5 text-sm text-texto">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-aviso" aria-hidden /> {/* decorativo: o texto ao lado já explica tudo */}
      <p>
        {email && ( // "Enviamos para..." só aparece quando sabemos o email (sempre sabemos, nos 2 usos atuais)
          <>Enviamos para <strong className="text-texto">{email}</strong>. </>
        )}
        Não encontrou o email? Confira a caixa de <strong>SPAM</strong> ou Lixo eletrônico. Se estiver lá,
        marque como “Não é spam” para o botão funcionar.
      </p>
    </div>
  );
}
