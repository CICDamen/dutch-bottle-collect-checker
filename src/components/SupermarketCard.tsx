import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupermarketData } from '@/types/supermarket';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';

interface SupermarketCardProps {
  supermarket: SupermarketData;
  onReportIncident: (supermarket: SupermarketData) => void;
}

const SupermarketCard: React.FC<SupermarketCardProps> = ({ 
  supermarket, 
  onReportIncident 
}) => {
  const getStatusBadge = () => {
    switch (supermarket.status) {
      case 'open':
        return <Badge className="bg-status-open hover:bg-status-open text-status-open-foreground">Inzameling Open</Badge>;
      case 'closed':
        return <Badge className="bg-status-closed hover:bg-status-closed text-status-closed-foreground">Inzameling Gesloten</Badge>;
      default:
        return <Badge className="bg-status-unknown hover:bg-status-unknown text-status-unknown-foreground">Status Onbekend</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{supermarket.chain}</CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground">{supermarket.name}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p>{supermarket.address}</p>
            <p>{supermarket.postalCode} {supermarket.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Laatst bijgewerkt: {formatDateTime(supermarket.lastUpdated)}
          </span>
        </div>

        {supermarket.incident && (
          <div className="flex items-start gap-2 p-3 bg-status-closed/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-status-closed mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-status-closed">Gemeld incident:</p>
              <p className="text-muted-foreground">{supermarket.incident.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateTime(supermarket.incident.reportedAt)} door {supermarket.incident.reportedBy}
              </p>
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={() => onReportIncident(supermarket)}
        >
          Incident Melden
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupermarketCard;