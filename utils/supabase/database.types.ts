// ============================================================================
// database.types.ts
// Tipos TypeScript do banco, no mesmo formato que o comando
// "supabase gen types typescript" geraria. Escrevi este arquivo NA MÃO porque
// a CLI do Supabase precisa de login (ver PENDENCIAS.md) -- mas o formato é
// o mesmo, então quando você rodar o comando de verdade, ele só vai
// SUBSTITUIR este arquivo (sem precisar mudar nada no resto do código).
// A fonte da verdade é o schema em supabase/migrations/001, 002 e 003.
// ============================================================================

export type Json = // formato que o Postgres usa pra colunas "jsonb" (não temos nenhuma ainda, mas o gerador sempre inclui esse tipo)
  | string
  | number
  | boolean
  | null
  | { [chave: string]: Json | undefined }
  | Json[];

export interface Database { // o tipo raiz: uma chave por "schema" do Postgres (só usamos o "public")
  public: {
    Tables: { // uma entrada por tabela, cada uma com o formato de leitura (Row), criação (Insert) e atualização (Update)
      barbearias: {
        Row: { // formato de uma linha depois de lida do banco (ex: num "select")
          id: string; // uuid, sempre presente numa linha já salva
          nome: string; // nunca é null (not null no banco)
          slug: string; // nunca é null, e é único (ver constraint unique no banco)
          telefone: string | null; // coluna opcional no banco, por isso pode vir null
          endereco: string | null; // idem
          criado_em: string; // timestamptz vira string no JSON (ISO 8601)
        };
        Insert: { // formato aceito por um "insert"; campos com valor padrão no banco ficam opcionais aqui
          id?: string; // tem "default gen_random_uuid()", por isso opcional
          nome: string; // obrigatório: não tem default
          slug: string; // obrigatório: não tem default
          telefone?: string | null; // opcional e aceita null
          endereco?: string | null; // opcional e aceita null
          criado_em?: string; // tem "default now()", por isso opcional
        };
        Update: Partial<Database["public"]["Tables"]["barbearias"]["Insert"]>; // num "update" tudo é opcional (você manda só o que quer mudar)
        Relationships: []; // essa tabela não tem chave estrangeira pra nenhuma outra
      };
      membros: {
        Row: {
          barbearia_id: string; // metade da chave primária composta
          user_id: string; // outra metade da chave primária composta (vem de auth.users)
          papel: Database["public"]["Enums"]["papel_membro"]; // só pode ser 'dono' ou 'funcionario' (enum do banco)
          criado_em: string;
        };
        Insert: {
          barbearia_id: string; // obrigatório: é parte da chave primária
          user_id: string; // obrigatório: é parte da chave primária
          papel: Database["public"]["Enums"]["papel_membro"]; // obrigatório: não tem valor padrão
          criado_em?: string; // tem default now()
        };
        Update: Partial<Database["public"]["Tables"]["membros"]["Insert"]>;
        Relationships: [ // liga "membros" a "barbearias" (user_id também referencia auth.users, fora do schema "public")
          {
            foreignKeyName: "membros_barbearia_id_fkey"; // nome padrão que o Postgres dá: "<tabela>_<coluna>_fkey"
            columns: ["barbearia_id"]; // coluna desta tabela que é a chave estrangeira
            isOneToOne: false; // "barbearia_id" não é único aqui, então uma barbearia tem vários membros
            referencedRelation: "barbearias"; // tabela referenciada
            referencedColumns: ["id"]; // coluna referenciada na outra tabela
          },
        ];
      };
      barbeiros: {
        Row: {
          id: string;
          barbearia_id: string;
          user_id: string | null; // opcional: nem todo barbeiro tem login próprio
          nome: string;
          ativo: boolean; // tem default, mas nunca é null depois de criado
          criado_em: string;
        };
        Insert: {
          id?: string; // default gen_random_uuid()
          barbearia_id: string; // obrigatório
          user_id?: string | null; // opcional e aceita null
          nome: string; // obrigatório
          ativo?: boolean; // default true
          criado_em?: string; // default now()
        };
        Update: Partial<Database["public"]["Tables"]["barbeiros"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "barbeiros_barbearia_id_fkey";
            columns: ["barbearia_id"];
            isOneToOne: false; // uma barbearia tem vários barbeiros
            referencedRelation: "barbearias";
            referencedColumns: ["id"];
          },
        ];
      };
      servicos: {
        Row: {
          id: string;
          barbearia_id: string;
          nome: string;
          duracao_min: number; // "int" do Postgres vira "number" no TypeScript
          preco_centavos: number; // guardado em centavos, de propósito (ver utils/dinheiro.ts)
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          barbearia_id: string;
          nome: string;
          duracao_min: number; // obrigatório: tem "check (> 0)", mas não tem default
          preco_centavos: number; // obrigatório: tem "check (>= 0)", mas não tem default
          ativo?: boolean; // default true
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["servicos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "servicos_barbearia_id_fkey";
            columns: ["barbearia_id"];
            isOneToOne: false; // uma barbearia tem vários serviços
            referencedRelation: "barbearias";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          barbearia_id: string;
          nome: string;
          telefone: string; // só dígitos, 10 ou 11 números (constraint "clientes_telefone_formato" da migration 003)
          criado_em: string;
        };
        Insert: {
          id?: string;
          barbearia_id: string;
          nome: string; // obrigatório
          telefone: string; // obrigatório; precisa já estar normalizado (ver utils/telefone.ts) por causa da constraint
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clientes_barbearia_id_fkey";
            columns: ["barbearia_id"];
            isOneToOne: false; // uma barbearia tem vários clientes
            referencedRelation: "barbearias";
            referencedColumns: ["id"];
          },
        ];
      };
      horarios_trabalho: {
        Row: {
          id: string;
          barbearia_id: string;
          barbeiro_id: string;
          dia_semana: number; // 0 (domingo) a 6 (sábado); "check" no banco garante esse intervalo
          inicio: string; // "time" do Postgres vira string "HH:MM:SS"
          fim: string;
        };
        Insert: {
          id?: string;
          barbearia_id: string;
          barbeiro_id: string;
          dia_semana: number; // obrigatório: sem default
          inicio: string; // obrigatório: sem default
          fim: string; // obrigatório: sem default
        };
        Update: Partial<Database["public"]["Tables"]["horarios_trabalho"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "horarios_trabalho_barbearia_id_fkey";
            columns: ["barbearia_id"];
            isOneToOne: false;
            referencedRelation: "barbearias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "horarios_trabalho_barbeiro_id_fkey";
            columns: ["barbeiro_id"];
            isOneToOne: false; // um barbeiro tem vários intervalos de horário (um por dia da semana, podendo repetir)
            referencedRelation: "barbeiros";
            referencedColumns: ["id"];
          },
        ];
      };
      agendamentos: {
        Row: {
          id: string;
          barbearia_id: string;
          barbeiro_id: string;
          cliente_id: string;
          servico_id: string;
          inicio: string; // timestamptz -> string ISO 8601
          fim: string;
          preco_centavos: number;
          status: Database["public"]["Enums"]["status_agendamento"]; // enum: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou'
          observacao: string | null; // opcional
          criado_em: string;
        };
        Insert: {
          id?: string;
          barbearia_id: string;
          barbeiro_id: string;
          cliente_id: string;
          servico_id: string;
          inicio: string; // obrigatório: sem default
          fim: string; // obrigatório: sem default
          preco_centavos: number; // obrigatório: copiado do serviço no momento do agendamento
          status?: Database["public"]["Enums"]["status_agendamento"]; // default 'agendado'
          observacao?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agendamentos"]["Insert"]>;
        Relationships: [ // as 4 chaves estrangeiras desta tabela, usadas pelo Supabase pra tipar os "selects" com embed (ex: "barbeiro:barbeiros(nome)")
          {
            foreignKeyName: "agendamentos_barbearia_id_fkey";
            columns: ["barbearia_id"];
            isOneToOne: false;
            referencedRelation: "barbearias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey";
            columns: ["barbeiro_id"];
            isOneToOne: false; // um barbeiro tem vários agendamentos
            referencedRelation: "barbeiros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false; // um cliente tem vários agendamentos
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey";
            columns: ["servico_id"];
            isOneToOne: false; // um serviço aparece em vários agendamentos
            referencedRelation: "servicos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>; // não criamos nenhuma view no banco ainda ("Record<string, never>" = objeto sem nenhuma chave, sem acionar o lint de "{}")
    Functions: { // uma entrada por função (RPC) chamada pelo site, com os tipos de entrada (Args) e saída (Returns)
      eh_membro: { // usada só dentro das policies de RLS; o site nunca chama ela diretamente
        Args: { b_id: string };
        Returns: boolean;
      };
      criar_barbearia: { // chamada pelo onboarding (app/onboarding/actions.ts)
        Args: { p_nome: string; p_slug: string };
        Returns: string; // devolve o id (uuid) da barbearia criada
      };
      buscar_barbearia_publica: { // chamada pela página pública (app/b/[slug]/page.tsx)
        Args: { p_slug: string };
        Returns: { id: string; nome: string; telefone: string | null; endereco: string | null }[]; // "returns table" vira um array
      };
      listar_barbeiros_publicos: { // chamada pela página pública
        Args: { p_barbearia_id: string };
        Returns: { id: string; nome: string }[];
      };
      listar_servicos_publicos: { // chamada pela página pública
        Args: { p_barbearia_id: string };
        Returns: { id: string; nome: string; duracao_min: number; preco_centavos: number }[];
      };
      listar_horarios_livres: { // chamada pelo formulário público, a cada troca de barbeiro/serviço/data
        Args: { p_barbeiro_id: string; p_data: string; p_servico_id: string };
        Returns: { horario: string }[]; // "time" devolvido como string "HH:MM:SS"
      };
      criar_agendamento_publico: { // chamada pelo formulário público, ao confirmar o agendamento
        Args: {
          p_barbearia_id: string;
          p_barbeiro_id: string;
          p_servico_id: string;
          p_data: string; // "date" enviado como string "AAAA-MM-DD"
          p_hora: string; // "time" enviado como string "HH:MM" ou "HH:MM:SS"
          p_nome_cliente: string;
          p_telefone_cliente: string;
        };
        Returns: string; // devolve o id (uuid) do agendamento criado
      };
    };
    Enums: { // os 2 tipos "enum" criados no banco (migration 001)
      papel_membro: "dono" | "funcionario";
      status_agendamento: "agendado" | "confirmado" | "concluido" | "cancelado" | "faltou";
    };
    CompositeTypes: Record<string, never>; // não criamos nenhum tipo composto no banco
  };
}

// ----------------------------------------------------------------------------
// Atalhos (NÃO fazem parte do que "supabase gen types" gera -- são um padrão
// recomendado pela própria documentação do Supabase, pra não precisar
// escrever "Database['public']['Tables'][...]['Row']" toda vez que for usar
// um tipo. Ficam aqui no mesmo arquivo pra tudo sobre tipos do banco morar
// num só lugar).
// ----------------------------------------------------------------------------

export type Tabelas<Nome extends keyof Database["public"]["Tables"]> = // formato de uma linha já salva (Row) de uma tabela
  Database["public"]["Tables"][Nome]["Row"];

export type NovaLinha<Nome extends keyof Database["public"]["Tables"]> = // formato aceito ao inserir (Insert) nessa tabela
  Database["public"]["Tables"][Nome]["Insert"];

export type AtualizacaoLinha<Nome extends keyof Database["public"]["Tables"]> = // formato aceito ao atualizar (Update) essa tabela
  Database["public"]["Tables"][Nome]["Update"];

export type TipoEnum<Nome extends keyof Database["public"]["Enums"]> = // um dos enums do banco (ex: TipoEnum<'status_agendamento'>)
  Database["public"]["Enums"][Nome];
