// ============================================================================
// database.types.ts
// GERADO DE VERDADE pela CLI do Supabase (não é mais escrito à mão):
//   npx supabase gen types typescript --project-id bvspfjhcooygqfsgirnu
// Rode "npm run gen:types" para atualizar este arquivo sempre que o banco
// mudar (nova tabela, nova coluna, nova função). A seção "Atalhos" no final
// NÃO faz parte do que a CLI gera -- é colada de volta manualmente depois
// (ou pelo próprio Claude, se você pedir pra regenerar numa conversa).
// ============================================================================

export type Json = // formato que o Postgres usa pra colunas "jsonb" (não temos nenhuma ainda, mas o gerador sempre inclui esse tipo)
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = { // o tipo raiz: uma chave por "schema" do Postgres (só usamos o "public")
  // Permite o createClient() descobrir sozinho a versão do PostgREST, sem precisar escrever
  // createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY) toda vez
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: { // uma entrada por tabela, cada uma com o formato de leitura (Row), criação (Insert) e atualização (Update)
      agendamentos: {
        Row: { // formato de uma linha depois de lida do banco (ex: num "select")
          barbearia_id: string
          barbeiro_id: string
          cliente_id: string
          criado_em: string
          fim: string
          id: string
          inicio: string
          observacao: string | null // opcional
          preco_centavos: number
          servico_id: string
          status: Database["public"]["Enums"]["status_agendamento"] // enum: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou'
        }
        Insert: { // formato aceito por um "insert"; campos com valor padrão no banco ficam opcionais aqui
          barbearia_id: string
          barbeiro_id: string
          cliente_id: string
          criado_em?: string // tem default now()
          fim: string
          id?: string // tem default gen_random_uuid()
          inicio: string
          observacao?: string | null
          preco_centavos: number // copiado do serviço no momento do agendamento
          servico_id: string
          status?: Database["public"]["Enums"]["status_agendamento"] // default 'agendado'
        }
        Update: { // num "update" tudo é opcional (você manda só o que quer mudar)
          barbearia_id?: string
          barbeiro_id?: string
          cliente_id?: string
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          observacao?: string | null
          preco_centavos?: number
          servico_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Relationships: [ // as 4 chaves estrangeiras desta tabela, usadas pelo Supabase pra tipar os "selects" com embed (ex: "barbeiro:barbeiros(nome)")
          {
            foreignKeyName: "agendamentos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false // um barbeiro tem vários agendamentos
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false // um cliente tem vários agendamentos
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false // um serviço aparece em vários agendamentos
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      barbearias: {
        Row: {
          criado_em: string
          endereco: string | null // coluna opcional no banco, por isso pode vir null
          id: string
          nome: string // nunca é null (not null no banco)
          slug: string // nunca é null, e é único (ver constraint unique no banco)
          telefone: string | null
        }
        Insert: {
          criado_em?: string // tem default now()
          endereco?: string | null
          id?: string // tem default gen_random_uuid()
          nome: string // obrigatório: não tem default
          slug: string // obrigatório: não tem default
          telefone?: string | null
        }
        Update: {
          criado_em?: string
          endereco?: string | null
          id?: string
          nome?: string
          slug?: string
          telefone?: string | null
        }
        Relationships: [] // essa tabela não tem chave estrangeira pra nenhuma outra
      }
      barbeiros: {
        Row: {
          ativo: boolean // tem default, mas nunca é null depois de criado
          barbearia_id: string
          criado_em: string
          id: string
          nome: string
          user_id: string | null // opcional: nem todo barbeiro tem login próprio
        }
        Insert: {
          ativo?: boolean // default true
          barbearia_id: string
          criado_em?: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          criado_em?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbeiros_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false // uma barbearia tem vários barbeiros
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          barbearia_id: string
          criado_em: string
          id: string
          nome: string
          telefone: string // só dígitos, 10 ou 11 números (constraint "clientes_telefone_formato" da migration 003)
        }
        Insert: {
          barbearia_id: string
          criado_em?: string
          id?: string
          nome: string // obrigatório
          telefone: string // obrigatório; precisa já estar normalizado (ver utils/telefone.ts) por causa da constraint
        }
        Update: {
          barbearia_id?: string
          criado_em?: string
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false // uma barbearia tem vários clientes
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_trabalho: {
        Row: {
          barbearia_id: string
          barbeiro_id: string
          dia_semana: number // 0 (domingo) a 6 (sábado); "check" no banco garante esse intervalo
          fim: string
          id: string
          inicio: string // "time" do Postgres vira string "HH:MM:SS"
        }
        Insert: {
          barbearia_id: string
          barbeiro_id: string
          dia_semana: number // obrigatório: sem default
          fim: string // obrigatório: sem default
          id?: string
          inicio: string // obrigatório: sem default
        }
        Update: {
          barbearia_id?: string
          barbeiro_id?: string
          dia_semana?: number
          fim?: string
          id?: string
          inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_trabalho_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_trabalho_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false // um barbeiro tem vários intervalos de horário (um por dia da semana, podendo repetir)
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          barbearia_id: string // metade da chave primária composta
          criado_em: string
          papel: Database["public"]["Enums"]["papel_membro"] // só pode ser 'dono' ou 'funcionario' (enum do banco)
          user_id: string // outra metade da chave primária composta (vem de auth.users)
        }
        Insert: {
          barbearia_id: string // obrigatório: é parte da chave primária
          criado_em?: string // tem default now()
          // NOTA: a CLI detectou um "default" pra esta coluna direto no banco (por isso "papel?" é
          // opcional aqui), mas nenhuma migration versionada define esse default -- foi alterado manualmente
          // pelo painel do Supabase em algum momento. Ver observação no RELATORIO.md desta rodada.
          papel?: Database["public"]["Enums"]["papel_membro"]
          user_id: string // obrigatório: é parte da chave primária
        }
        Update: {
          barbearia_id?: string
          criado_em?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          user_id?: string
        }
        Relationships: [ // liga "membros" a "barbearias" (user_id também referencia auth.users, fora do schema "public")
          {
            foreignKeyName: "membros_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false // "barbearia_id" não é único aqui, então uma barbearia tem vários membros
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          barbearia_id: string
          criado_em: string
          duracao_min: number // "int" do Postgres vira "number" no TypeScript
          id: string
          nome: string
          preco_centavos: number // guardado em centavos, de propósito (ver utils/dinheiro.ts)
        }
        Insert: {
          ativo?: boolean // default true
          barbearia_id: string
          criado_em?: string
          duracao_min: number // obrigatório: tem "check (> 0)", mas não tem default
          id?: string
          nome: string
          preco_centavos: number // obrigatório: tem "check (>= 0)", mas não tem default
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          criado_em?: string
          duracao_min?: number
          id?: string
          nome?: string
          preco_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false // uma barbearia tem vários serviços
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never // não criamos nenhuma view no banco ainda
    }
    Functions: { // uma entrada por função (RPC) chamada pelo site, com os tipos de entrada (Args) e saída (Returns)
      buscar_barbearia_publica: { // chamada pela página pública (app/b/[slug]/page.tsx)
        // NOTA: a CLI marca "endereco"/"telefone"/"nome" como não-nulos aqui, mas a coluna real em
        // "barbearias" aceita null -- é uma limitação do gerador para funções "returns table" (ele não
        // analisa a query interna, só a assinatura). O código já trata "endereco" como opcional
        // (checagem truthy em app/b/[slug]/page.tsx), então não há bug na prática.
        Args: { p_slug: string }
        Returns: {
          endereco: string
          id: string
          nome: string
          telefone: string
        }[]
      }
      criar_agendamento_publico: { // chamada pelo formulário público, ao confirmar o agendamento
        Args: {
          p_barbearia_id: string
          p_barbeiro_id: string
          p_data: string // "date" enviado como string "AAAA-MM-DD"
          p_hora: string // "time" enviado como string "HH:MM" ou "HH:MM:SS"
          p_nome_cliente: string
          p_servico_id: string
          p_telefone_cliente: string
        }
        Returns: string // devolve o id (uuid) do agendamento criado
      }
      criar_barbearia: { // chamada pelo onboarding (app/onboarding/actions.ts)
        Args: { p_nome: string; p_slug: string }
        Returns: string // devolve o id (uuid) da barbearia criada
      }
      eh_membro: { Args: { b_id: string }; Returns: boolean } // usada só dentro das policies de RLS; o site nunca chama ela diretamente
      listar_barbeiros_publicos: { // chamada pela página pública
        Args: { p_barbearia_id: string }
        Returns: {
          id: string
          nome: string
        }[]
      }
      listar_horarios_livres: { // chamada pelo formulário público, a cada troca de barbeiro/serviço/data
        Args: { p_barbeiro_id: string; p_data: string; p_servico_id: string }
        Returns: {
          horario: string // "time" devolvido como string "HH:MM:SS"
        }[]
      }
      listar_servicos_publicos: { // chamada pela página pública
        Args: { p_barbearia_id: string }
        Returns: {
          duracao_min: number
          id: string
          nome: string
          preco_centavos: number
        }[]
      }
    }
    Enums: { // os 2 tipos "enum" criados no banco (migration 001)
      papel_membro: "dono" | "funcionario"
      status_agendamento:
        | "agendado"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "faltou"
    }
    CompositeTypes: {
      [_ in never]: never // não criamos nenhum tipo composto no banco
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase"> // remove a chave interna antes de procurar os schemas (ela não é um schema de verdade)

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">] // schema usado quando ninguém especifica outro (sempre "public" aqui)

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_membro: ["dono", "funcionario"],
      status_agendamento: [
        "agendado",
        "confirmado",
        "concluido",
        "cancelado",
        "faltou",
      ],
    },
  },
} as const

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
