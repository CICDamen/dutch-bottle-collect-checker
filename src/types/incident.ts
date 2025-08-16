export interface SupermarketIncident {
  id: string;
  supermarket_id: string;
  incident_type: 'machine_broken' | 'machine_full' | 'machine_offline' | 'no_bottles_accepted' | 'partial_functionality' | 'resolved';
  description?: string;
  reporter_email?: string;
  reporter_name?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SupermarketIncidentSummary {
  supermarket_id: string;
  supermarket_name: string;
  chain: string;
  city: string;
  total_incidents: number;
  active_incidents: number;
  last_incident_date?: string;
  active_incident_types?: string;
}

export interface AdminDashboardStats {
  total_supermarkets: number;
  total_incidents: number;
  active_incidents: number;
  resolved_incidents: number;
  last_sync_date?: string;
}

export interface IncidentReportForm {
  supermarket_id: string;
  incident_type: SupermarketIncident['incident_type'];
  description?: string;
  reporter_email?: string;
  reporter_name?: string;
  priority?: SupermarketIncident['priority'];
}
