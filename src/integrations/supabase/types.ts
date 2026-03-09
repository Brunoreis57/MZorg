export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_email?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      biddings: {
        Row: {
          city: string
          code: string
          created_at: string
          date: string
          edital_url: string | null
          entity: string
          estimated_value: number
          id: string
          object: string
          portal: string
          status: string
          time: string
          type: string
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          code: string
          created_at?: string
          date?: string
          edital_url?: string | null
          entity: string
          estimated_value?: number
          id?: string
          object: string
          portal?: string
          status?: string
          time?: string
          type?: string
          uf?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          code?: string
          created_at?: string
          date?: string
          edital_url?: string | null
          entity?: string
          estimated_value?: number
          id?: string
          object?: string
          portal?: string
          status?: string
          time?: string
          type?: string
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          descricao: string
          id: string
          quantidade: number
          unidade: string
          user_id: string
          valor_unitario: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          unidade?: string
          user_id: string
          valor_unitario?: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          unidade?: string
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          bidding_id: string
          created_at: string
          data: string
          fornecedor_categoria: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          observacoes: string | null
          user_id: string
          vinculado: boolean
        }
        Insert: {
          bidding_id: string
          created_at?: string
          data?: string
          fornecedor_categoria?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacoes?: string | null
          user_id: string
          vinculado?: boolean
        }
        Update: {
          bidding_id?: string
          created_at?: string
          data?: string
          fornecedor_categoria?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacoes?: string | null
          user_id?: string
          vinculado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "budgets_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: false
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      certidoes: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_vencimento: string
          descricao: string | null
          empresa_id: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          empresa_id: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certidoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          anticipation_allowed: boolean
          bidding_id: string
          contract_end_date: string | null
          contract_number: string
          contract_start_date: string | null
          created_at: string
          estimated_payment_days: number
          id: string
          monthly_value: number
          orgao: string
          payment_cycle: string
          supplier_id: string | null
          supplier_monthly_value: number
          supplier_name: string | null
          supplier_payment_rule: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anticipation_allowed?: boolean
          bidding_id: string
          contract_end_date?: string | null
          contract_number?: string
          contract_start_date?: string | null
          created_at?: string
          estimated_payment_days?: number
          id?: string
          monthly_value?: number
          orgao?: string
          payment_cycle?: string
          supplier_id?: string | null
          supplier_monthly_value?: number
          supplier_name?: string | null
          supplier_payment_rule?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anticipation_allowed?: boolean
          bidding_id?: string
          contract_end_date?: string | null
          contract_number?: string
          contract_start_date?: string | null
          created_at?: string
          estimated_payment_days?: number
          id?: string
          monthly_value?: number
          orgao?: string
          payment_cycle?: string
          supplier_id?: string | null
          supplier_monthly_value?: number
          supplier_name?: string | null
          supplier_payment_rule?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: false
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_service_items: {
        Row: {
          created_at: string
          destino: string | null
          id: string
          origem: string | null
          paradas: Json
          passageiros_carga: string | null
          quantidade: number
          service_id: string
          tipo_veiculo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destino?: string | null
          id?: string
          origem?: string | null
          paradas?: Json
          passageiros_carga?: string | null
          quantidade?: number
          service_id: string
          tipo_veiculo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destino?: string | null
          id?: string
          origem?: string | null
          paradas?: Json
          passageiros_carga?: string | null
          quantidade?: number
          service_id?: string
          tipo_veiculo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_service_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "daily_services"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_services: {
        Row: {
          bidding_id: string | null
          created_at: string
          custo_fornecedor: number
          data: string
          fornecedor_id: string | null
          fornecedor_nome: string | null
          foto_odometro: string | null
          hora_saida: string | null
          id: string
          impostos: number
          km_final: number | null
          km_inicial: number | null
          km_total: number
          lucro_liquido: number
          observacoes: string | null
          previsao_volta: string | null
          receita_bruta: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bidding_id?: string | null
          created_at?: string
          custo_fornecedor?: number
          data?: string
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          foto_odometro?: string | null
          hora_saida?: string | null
          id?: string
          impostos?: number
          km_final?: number | null
          km_inicial?: number | null
          km_total?: number
          lucro_liquido?: number
          observacoes?: string | null
          previsao_volta?: string | null
          receita_bruta?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bidding_id?: string | null
          created_at?: string
          custo_fornecedor?: number
          data?: string
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          foto_odometro?: string | null
          hora_saida?: string | null
          id?: string
          impostos?: number
          km_final?: number | null
          km_inicial?: number | null
          km_total?: number
          lucro_liquido?: number
          observacoes?: string | null
          previsao_volta?: string | null
          receita_bruta?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_services_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: false
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_services_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_upload: string
          empresa_id: string
          id: string
          nome: string
          tipo: string | null
          user_id: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_upload?: string
          empresa_id: string
          id?: string
          nome: string
          tipo?: string | null
          user_id: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_upload?: string
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          agencia: string | null
          banco: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          conta: string | null
          created_at: string
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome: string
          pix_chave: string | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          conta?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome: string
          pix_chave?: string | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          conta?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome?: string
          pix_chave?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          contract_id: string | null
          created_at: string
          date: string
          description: string | null
          entity: string | null
          id: string
          nf_number: string | null
          status: string
          supplier_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          contract_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          entity?: string | null
          id?: string
          nf_number?: string | null
          status?: string
          supplier_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          contract_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          entity?: string | null
          id?: string
          nf_number?: string | null
          status?: string
          supplier_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_precos: {
        Row: {
          created_at: string
          fornecedor_id: string
          id: string
          nome_maquina: string | null
          tipo_cobranca: string
          user_id: string
          valor: number
          veiculo: string
        }
        Insert: {
          created_at?: string
          fornecedor_id: string
          id?: string
          nome_maquina?: string | null
          tipo_cobranca?: string
          user_id: string
          valor?: number
          veiculo: string
        }
        Update: {
          created_at?: string
          fornecedor_id?: string
          id?: string
          nome_maquina?: string | null
          tipo_cobranca?: string
          user_id?: string
          valor?: number
          veiculo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_precos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categoria: string
          cidade: string | null
          cnpj: string
          contato_whatsapp: string | null
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string
          razao_social: string | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          cidade?: string | null
          cnpj?: string
          contato_whatsapp?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia: string
          razao_social?: string | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          cidade?: string | null
          cnpj?: string
          contato_whatsapp?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string
          razao_social?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          archived: boolean
          color: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_schedule: {
        Row: {
          actual_date: string | null
          amount: number
          anticipation_date: string | null
          anticipation_requested: boolean
          bidding_code: string | null
          contract_id: string
          created_at: string
          description: string | null
          entity: string | null
          expected_date: string | null
          health_status: string
          id: string
          nf_number: string | null
          nf_status: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          actual_date?: string | null
          amount?: number
          anticipation_date?: string | null
          anticipation_requested?: boolean
          bidding_code?: string | null
          contract_id: string
          created_at?: string
          description?: string | null
          entity?: string | null
          expected_date?: string | null
          health_status?: string
          id?: string
          nf_number?: string | null
          nf_status?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          actual_date?: string | null
          amount?: number
          anticipation_date?: string | null
          anticipation_requested?: boolean
          bidding_code?: string | null
          contract_id?: string
          created_at?: string
          description?: string | null
          entity?: string | null
          expected_date?: string | null
          health_status?: string
          id?: string
          nf_number?: string | null
          nf_status?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_items: {
        Row: {
          id: string
          contract_id: string
          item_number: number
          description: string
          unit: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contract_id: string
          item_number?: number
          description: string
          unit: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contract_id?: string
          item_number?: number
          description?: string
          unit?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          }
        ]
      }
      pricing_configs: {
        Row: {
          id: string
          bidding_id: string
          config: Json
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          bidding_id: string
          config: Json
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          bidding_id?: string
          config?: Json
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_configs_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: true
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          }
        ]
      }
      pricing_scenarios: {
        Row: {
          bidding_id: string
          created_at: string
          id: string
          inputs: Json
          name: string
          results: Json
          user_id: string
        }
        Insert: {
          bidding_id: string
          created_at?: string
          id?: string
          inputs?: Json
          name?: string
          results?: Json
          user_id: string
        }
        Update: {
          bidding_id?: string
          created_at?: string
          id?: string
          inputs?: Json
          name?: string
          results?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_scenarios_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: false
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          read: boolean
          time: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          read?: boolean
          time?: string
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          read?: boolean
          time?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived: boolean
          completed: boolean
          created_at: string
          id: string
          linked_bidding: string | null
          pinned: boolean
          priority: string
          reminder_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          completed?: boolean
          created_at?: string
          id?: string
          linked_bidding?: string | null
          pinned?: boolean
          priority?: string
          reminder_date?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          completed?: boolean
          created_at?: string
          id?: string
          linked_bidding?: string | null
          pinned?: boolean
          priority?: string
          reminder_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      won_items: {
        Row: {
          bidding_id: string
          created_at: string
          id: string
          items: Json
          updated_at: string
          user_id: string
          valor_km_total: number
          valor_total_edital: number
          won_type: string
        }
        Insert: {
          bidding_id: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id: string
          valor_km_total?: number
          valor_total_edital?: number
          won_type?: string
        }
        Update: {
          bidding_id?: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id?: string
          valor_km_total?: number
          valor_total_edital?: number
          won_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "won_items_bidding_id_fkey"
            columns: ["bidding_id"]
            isOneToOne: false
            referencedRelation: "biddings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
