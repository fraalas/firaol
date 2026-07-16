export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'ceo' | 'general_manager' | 'hr' | 'sales_manager' | 'agent'
          avatar_url: string | null
          department: string | null
          position: string | null
          address: string | null
          company_id: string | null
          status: string | null
          role_id: string | null
          business_unit_id: string | null
          manager_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      leads: {
        Row: {
          id: string
          agent_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          location: string | null
          budget: number | null
          interest: string | null
          stage: LeadStage
          source: LeadSource | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      properties: {
        Row: {
          id: string
          agent_id: string | null
          title: string
          address: string | null
          city: string | null
          price: number | null
          price_type: 'sale' | 'rent'
          status: 'available' | 'sold' | 'rented'
          bedrooms: number | null
          bathrooms: number | null
          area_sqm: number | null
          description: string | null
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      activities: {
        Row: {
          id: string
          agent_id: string | null
          lead_id: string | null
          type: ActivityType
          title: string
          notes: string | null
          scheduled_at: string
          completed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          agent_id: string
          leads_this_month: number
          new_leads: number
          closed_deals: number
          active_pipeline: number
          conversion_rate: number
        }
      }
    }
  }
}

export type LeadStage = 'new_lead' | 'contacted' | 'interested' | 'property_visit' | 'negotiation' | 'closed' | 'lost'
export type LeadSource = 'referral' | 'website' | 'social' | 'walk_in' | 'cold_call' | 'other'
export type ActivityType = 'call' | 'meeting' | 'site_visit' | 'follow_up' | 'contract' | 'other'

export type Profile   = Database['public']['Tables']['profiles']['Row']
export type Lead      = Database['public']['Tables']['leads']['Row']
export type Property  = Database['public']['Tables']['properties']['Row']
export type Activity  = Database['public']['Tables']['activities']['Row']