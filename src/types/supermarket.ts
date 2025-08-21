export interface SupermarketData {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  status: 'open' | 'closed' | 'unknown';
  lastUpdated: string;
  reportedBy?: string;
  openingHours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
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