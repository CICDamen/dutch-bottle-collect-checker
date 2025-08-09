export interface SupermarketData {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'closed' | 'unknown';
  lastUpdated: string;
  reportedBy?: string;
  incident?: {
    type: 'machine_broken' | 'store_closed' | 'no_bottles_accepted' | 'other';
    description: string;
    reportedAt: string;
    reportedBy: string;
  };
}

export interface IncidentReport {
  supermarketId: string;
  type: 'machine_broken' | 'store_closed' | 'no_bottles_accepted' | 'other';
  description: string;
  reporterName: string;
}