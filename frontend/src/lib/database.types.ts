// Database types for Supabase
// These match the tables created in Supabase

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string
          market_id: string
          contract_address: string
          network: 'bnb-testnet' | 'bnb-mainnet'
          sender_address: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          market_id: string
          contract_address: string
          network: 'bnb-testnet' | 'bnb-mainnet'
          sender_address: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          contract_address?: string
          network?: 'bnb-testnet' | 'bnb-mainnet'
          sender_address?: string
          message?: string
          created_at?: string
        }
      }
      chat_rate_limits: {
        Row: {
          wallet_address: string
          last_message_at: string
        }
        Insert: {
          wallet_address: string
          last_message_at?: string
        }
        Update: {
          wallet_address?: string
          last_message_at?: string
        }
      }
      moderated_markets: {
        Row: {
          id: string
          market_id: string
          contract_address: string
          network: 'bnb-testnet' | 'bnb-mainnet'
          hidden_fields: ('name' | 'rules' | 'evidence' | 'image')[]
          reason: string | null
          moderated_by: string
          moderated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          market_id: string
          contract_address: string
          network: 'bnb-testnet' | 'bnb-mainnet'
          hidden_fields: ('name' | 'rules' | 'evidence' | 'image')[]
          reason?: string | null
          moderated_by: string
          moderated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          market_id?: string
          contract_address?: string
          network?: 'bnb-testnet' | 'bnb-mainnet'
          hidden_fields?: ('name' | 'rules' | 'evidence' | 'image')[]
          reason?: string | null
          moderated_by?: string
          moderated_at?: string
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ModeratedMarket = Database['public']['Tables']['moderated_markets']['Row']
export type HiddenField = 'name' | 'rules' | 'evidence' | 'image'
export type Network = 'bnb-testnet' | 'bnb-mainnet'
