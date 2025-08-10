import React, { useState, useMemo } from 'react';
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
import { useSupermarkets } from '@/hooks/useSupermarkets';
import { Recycle, MapPin, AlertCircle, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupermarket, setSelectedSupermarket] = useState<SupermarketData | null>(null);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [isIncidentSearchOpen, setIsIncidentSearchOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    supermarkets,
    isLoading,
    error,
    useGooglePlaces,
    enableGooglePlaces,
    disableGooglePlaces,
    refreshSupermarkets,
    getCacheInfo
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
    const unknown = supermarkets.filter(s => s.status === 'unknown').length;
    
    return { total, open, closed, unknown };
  }, [supermarkets]);

  const handleSupermarketSelect = (supermarket: SupermarketData) => {
    setSelectedSupermarket(supermarket);
  };

  const handleReportIncident = (supermarket: SupermarketData) => {
    setSelectedSupermarket(supermarket);
    setIsIncidentDialogOpen(true);
  };

  const handleIncidentSubmit = (report: IncidentReport) => {
    toast({
      title: "Incident gemeld",
      description: "Bedankt voor uw melding. Deze functie werkt momenteel alleen met mock data.",
    });
  };

  const handleToggleGooglePlaces = async () => {
    if (useGooglePlaces) {
      disableGooglePlaces();
      toast({
        title: "Google Places uitgeschakeld",
        description: "Gebruikt nu lokale demo data",
      });
    } else {
      try {
        await enableGooglePlaces();
        toast({
          title: "Google Places ingeschakeld",
          description: "Haalt nu live supermarkt data op",
        });
      } catch (error) {
        toast({
          title: "Google Places API niet beschikbaar",
          description: "Configureer VITE_GOOGLE_PLACES_API_KEY in uw .env bestand",
          variant: "destructive",
        });
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshSupermarkets();
      toast({
        title: "Data ververst",
        description: "Supermarkt locaties zijn bijgewerkt",
      });
    } catch (error) {
      toast({
        title: "Refresh mislukt",
        description: "Kon de data niet vernieuwen",
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
            
            <div className="flex gap-2">
              <Button
                onClick={handleToggleGooglePlaces}
                variant={useGooglePlaces ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                {useGooglePlaces ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {useGooglePlaces ? "Live Data" : "Demo Data"}
              </Button>
              
              {useGooglePlaces && (
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Ververs
                </Button>
              )}
              
              <Button 
                onClick={() => setIsIncidentSearchOpen(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Incident Melden
              </Button>
            </div>
          </div>
          
          {/* Data Source Info */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {useGooglePlaces ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>
                {useGooglePlaces ? "Live data van Google Places API" : "Demo data"}
                {isLoading && " (laden...)"}
              </span>
            </div>
            {useGooglePlaces && (() => {
              const cacheInfo = getCacheInfo();
              return cacheInfo.hasCache && (
                <span>
                  Cache: {cacheInfo.itemCount} locaties, {Math.floor((cacheInfo.cacheAge || 0) / 60)}h oud
                </span>
              );
            })()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-status-unknown">{stats.unknown}</div>
              <div className="text-sm text-muted-foreground">Onbekend</div>
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