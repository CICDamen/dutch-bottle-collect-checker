import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SearchBar from '@/components/SearchBar';
import Map from '@/components/Map';
import SupermarketCard from '@/components/SupermarketCard';
import IncidentReportDialog from '@/components/IncidentReportDialog';
import IncidentSearchDialog from '@/components/IncidentSearchDialog';
import { SupermarketData, IncidentReport } from '@/types/supermarket';
import { IncidentReportForm } from '@/types/incident';
import { useSupermarkets } from '@/hooks/useSupermarkets';
import { databaseService } from '@/services/databaseService';
import { Recycle, MapPin, AlertCircle, AlertTriangle, Database } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupermarket, setSelectedSupermarket] = useState<SupermarketData | null>(null);
  const [mapSelectedSupermarket, setMapSelectedSupermarket] = useState<SupermarketData | null>(null);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [isIncidentSearchOpen, setIsIncidentSearchOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    supermarkets,
    isLoading,
    error
  } = useSupermarkets();

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

  // Statistics
  const stats = useMemo(() => {
    const total = supermarkets.length;
    const open = supermarkets.filter(s => s.status === 'open').length;
    const closed = supermarkets.filter(s => s.status === 'closed').length;
    
    return { total, open, closed };
  }, [supermarkets]);

  // Auto-zoom to supermarket when search results in single match
  useEffect(() => {
    if (filteredSupermarkets.length === 1 && searchQuery.trim()) {
      setMapSelectedSupermarket(filteredSupermarkets[0]);
    } else if (!searchQuery.trim()) {
      setMapSelectedSupermarket(null);
    }
  }, [filteredSupermarkets, searchQuery]);

  const handleSupermarketSelect = (supermarket: SupermarketData) => {
    setSelectedSupermarket(supermarket);
  };

  const handleLocationClick = (supermarket: SupermarketData) => {
    setMapSelectedSupermarket(supermarket);
  };

  const handleReportIncident = (supermarket: SupermarketData) => {
    setSelectedSupermarket(supermarket);
    setIsIncidentDialogOpen(true);
  };

  const handleIncidentSubmit = async (report: IncidentReportForm) => {
    if (!selectedSupermarket) return;

    try {
      await databaseService.reportIncident(report);
      
      setIsIncidentDialogOpen(false);
      toast({
        title: "Incident gemeld",
        description: "Bedankt voor uw melding. Het incident is geregistreerd en admin is op de hoogte.",
      });
    } catch (error) {
      toast({
        title: "Melding mislukt",
        description: "Kon het incident niet opslaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };


  const handleIncidentSearchSelect = (supermarket: SupermarketData) => {
    setSelectedSupermarket(supermarket);
    setIsIncidentDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Recycle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Statiegeld Locaties Nederland
              </h1>
              <p className="text-muted-foreground">
                Vind flesseninzamelpunten en meld storingen
              </p>
            </div>
          </div>
          
          {/* Search Bar and Control Buttons */}
          <div className="flex gap-4 items-start flex-wrap">
            <div className="max-w-md flex-1 min-w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Zoek op stad, supermarkt of postcode..."
              />
            </div>
            
            <Button 
              onClick={() => setIsIncidentSearchOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Incident Melden
            </Button>
          </div>
          
          {/* Loading Info */}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Database data laden...</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Totaal locaties</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-status-open">{stats.open}</div>
              <div className="text-sm text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-status-closed">{stats.closed}</div>
              <div className="text-sm text-muted-foreground">Gesloten</div>
            </CardContent>
          </Card>
        </div>

        {/* Map and Results */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Kaart van Nederland
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] rounded-b-lg overflow-hidden">
                <Map
                  supermarkets={filteredSupermarkets}
                  searchQuery={searchQuery}
                  selectedSupermarket={mapSelectedSupermarket}
                  onSupermarketSelect={handleSupermarketSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Zoekresultaten ({filteredSupermarkets.length})
                </CardTitle>
              </CardHeader>
            </Card>
            
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {filteredSupermarkets.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Geen supermarkten gevonden voor "{searchQuery}"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredSupermarkets.map((supermarket) => (
                  <SupermarketCard
                    key={supermarket.id}
                    supermarket={supermarket}
                    onReportIncident={handleReportIncident}
                    onLocationClick={handleLocationClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Search Dialog */}
      <IncidentSearchDialog
        supermarkets={supermarkets}
        isOpen={isIncidentSearchOpen}
        onClose={() => setIsIncidentSearchOpen(false)}
        onSelectSupermarket={handleIncidentSearchSelect}
      />

      {/* Incident Report Dialog */}
      <IncidentReportDialog
        supermarket={selectedSupermarket}
        isOpen={isIncidentDialogOpen}
        onClose={() => setIsIncidentDialogOpen(false)}
        onSubmit={handleIncidentSubmit}
      />
    </div>
  );
};

export default Index;