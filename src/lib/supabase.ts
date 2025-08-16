import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'bottle_collection'
  }
})

export type Database = {
  bottle_collection: {
    Tables: {
      supermarkets: {
        Row: {
          id: string
          chain: string
          name: string
          address: string
          postal_code: string
          city: string
          latitude: number
          longitude: number
          google_place_id?: string
          opening_hours?: any
          status: 'open' | 'closed'
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          chain: string
          name: string
          address: string
          postal_code: string
          city: string
          latitude: number
          longitude: number
          google_place_id?: string
          opening_hours?: any
          status?: 'open' | 'closed'
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          chain?: string
          name?: string
          address?: string
          postal_code?: string
          city?: string
          latitude?: number
          longitude?: number
          google_place_id?: string
          opening_hours?: any
          status?: 'open' | 'closed'
          last_updated?: string
          created_at?: string
        }
      }
      supermarket_incidents: {
        Row: {
          id: string
          supermarket_id: string
          incident_type: 'machine_broken' | 'machine_full' | 'no_receipt' | 'wrong_amount' | 'other'
          description?: string
          reporter_email?: string
          reporter_name?: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'investigating' | 'resolved' | 'closed'
          admin_notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supermarket_id: string
          incident_type: 'machine_broken' | 'machine_full' | 'no_receipt' | 'wrong_amount' | 'other'
          description?: string
          reporter_email?: string
          reporter_name?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          admin_notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supermarket_id?: string
          incident_type?: 'machine_broken' | 'machine_full' | 'no_receipt' | 'wrong_amount' | 'other'
          description?: string
          reporter_email?: string
          reporter_name?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          admin_notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      sync_metadata: {
        Row: {
          id: number
          last_sync?: string
          total_locations?: number
          status?: string
          error_message?: string
          updated_at: string
        }
        Insert: {
          id?: number
          last_sync?: string
          total_locations?: number
          status?: string
          error_message?: string
          updated_at?: string
        }
        Update: {
          id?: number
          last_sync?: string
          total_locations?: number
          status?: string
          error_message?: string
          updated_at?: string
        }
      }
    }
    Views: {
      supermarket_incident_summary: {
        Row: {
          supermarket_id: string
          supermarket_name: string
          chain: string
          city: string
          active_incidents: number
          total_incidents: number
          active_incident_types?: string
          last_incident_date?: string
        }
      }
    }
    Functions: {
      get_admin_dashboard_stats: {
        Args: {}
        Returns: Array<{
          total_supermarkets: number
          total_incidents: number
          active_incidents: number
          resolved_incidents: number
        }>
      }
      bulk_resolve_incidents: {
        Args: {
          incident_ids: string[]
          admin_note?: string
        }
        Returns: number
      }
    }
  }
}