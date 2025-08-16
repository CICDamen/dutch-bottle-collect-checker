import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupermarketData } from '@/types/supermarket';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';
import { translateStatus } from '@/lib/utils';

interface SupermarketCardProps {
  supermarket: SupermarketData;
  onReportIncident: (supermarket: SupermarketData) => void;
  onLocationClick?: (supermarket: SupermarketData) => void;
}

const SupermarketCard: React.FC<SupermarketCardProps> = ({ 
  supermarket, 
  onReportIncident,
  onLocationClick 
}) => {
  const getStatusBadge = () => {
    const statusText = translateStatus(supermarket.status);
    switch (supermarket.status) {
      case 'open':
        return <Badge className="bg-status-open hover:bg-status-open text-status-open-foreground">{statusText}</Badge>;
      case 'closed':
        return <Badge className="bg-status-closed hover:bg-status-closed text-status-closed-foreground">{statusText}</Badge>;
      default:
        return <Badge className="bg-status-closed hover:bg-status-closed text-status-closed-foreground">{statusText}</Badge>;
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
            Laatst bijgewerkt: {(() => {
              const lastUpdated = new Date(supermarket.lastUpdated);
              const incidentDate = supermarket.incident ? new Date(supermarket.incident.reportedAt) : null;
              
              // Show incident timestamp if it's more recent than last updated
              if (incidentDate && incidentDate > lastUpdated) {
                return formatDateTime(supermarket.incident.reportedAt);
              }
              
              return formatDateTime(supermarket.lastUpdated);
            })()}
          </span>
        </div>

        {supermarket.incident && (
          <div className="flex items-start gap-2 p-3 bg-status-closed/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-status-closed mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-status-closed">Gemeld incident:</p>
              <p className="text-muted-foreground">{supermarket.incident.description}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onReportIncident(supermarket)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Incident Melden
          </Button>
          
          {onLocationClick && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onLocationClick(supermarket)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Toon op Kaart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupermarketCard;