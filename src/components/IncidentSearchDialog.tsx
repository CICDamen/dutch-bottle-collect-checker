import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupermarketData } from '@/types/supermarket';
import { Search, MapPin } from 'lucide-react';

interface IncidentSearchDialogProps {
  supermarkets: SupermarketData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSupermarket: (supermarket: SupermarketData) => void;
}

const IncidentSearchDialog: React.FC<IncidentSearchDialogProps> = ({
  supermarkets,
  isOpen,
  onClose,
  onSelectSupermarket,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter supermarkets based on search query
  const filteredSupermarkets = useMemo(() => {
    if (!searchQuery.trim()) return supermarkets;
    
    const query = searchQuery.toLowerCase();
    return supermarkets.filter(
      (supermarket) =>
        supermarket.name.toLowerCase().includes(query) ||
        supermarket.chain.toLowerCase().includes(query) ||
        supermarket.city.toLowerCase().includes(query) ||
        supermarket.postalCode.toLowerCase().includes(query) ||
        supermarket.address.toLowerCase().includes(query)
    );
  }, [supermarkets, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-status-open hover:bg-status-open text-status-open-foreground">Open</Badge>;
      case 'closed':
        return <Badge className="bg-status-closed hover:bg-status-closed text-status-closed-foreground">Gesloten</Badge>;
      default:
        return <Badge className="bg-status-unknown hover:bg-status-unknown text-status-unknown-foreground">Onbekend</Badge>;
    }
  };

  const handleSelectSupermarket = (supermarket: SupermarketData) => {
    onSelectSupermarket(supermarket);
    onClose();
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Incident Melden</DialogTitle>
          <DialogDescription>
            Zoek en selecteer een supermarkt om een incident te melden
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, stad, keten of postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredSupermarkets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? `Geen resultaten gevonden voor "${searchQuery}"` : 'Begin met typen om supermarkten te zoeken'}
              </div>
            ) : (
              filteredSupermarkets.map((supermarket) => (
                <Card key={supermarket.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectSupermarket(supermarket)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{supermarket.chain}</h4>
                        <p className="text-sm text-muted-foreground">{supermarket.name}</p>
                      </div>
                      {getStatusBadge(supermarket.status)}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{supermarket.address}</p>
                        <p>{supermarket.postalCode} {supermarket.city}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentSearchDialog;