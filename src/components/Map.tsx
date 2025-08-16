import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { SupermarketData } from '@/types/supermarket';
import { openInGoogleMaps } from '@/lib/utils';

interface MapProps {
  supermarkets: SupermarketData[];
  searchQuery: string;
  selectedSupermarket?: SupermarketData | null;
  onSupermarketSelect: (supermarket: SupermarketData) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 52.1326,
  lng: 5.2913
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const Map: React.FC<MapProps> = ({ supermarkets, searchQuery, selectedSupermarket, onSupermarketSelect }) => {
  const [selectedMarker, setSelectedMarker] = useState<SupermarketData | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    const bounds = new window.google.maps.LatLngBounds(center);
    supermarkets.forEach(supermarket => {
      bounds.extend({ lat: supermarket.latitude, lng: supermarket.longitude });
    });
    if (supermarkets.length > 1) {
      mapInstance.fitBounds(bounds);
    }
  }, [supermarkets]);

  // Handle zooming to selected supermarket
  React.useEffect(() => {
    if (map && selectedSupermarket) {
      const position = {
        lat: selectedSupermarket.latitude,
        lng: selectedSupermarket.longitude
      };
      
      // Smooth pan and zoom to the selected supermarket
      map.panTo(position);
      map.setZoom(16); // Close zoom level to show the specific location
      
      // Also set this as the selected marker for InfoWindow
      setSelectedMarker(selectedSupermarket);
    }
  }, [map, selectedSupermarket]);

  const onUnmount = useCallback(() => {
    // Cleanup if needed
  }, []);

  const handleMarkerClick = (supermarket: SupermarketData) => {
    setSelectedMarker(supermarket);
    onSupermarketSelect(supermarket);
  };


  const getMarkerIcon = (status: string): google.maps.Symbol => {
    // Color mapping: green = open, red = closed/gesloten
    const color = status === 'open' ? '#22c55e' : '#ef4444';
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      anchor: new google.maps.Point(0, 0)
    };
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Kaart laden...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={7}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {supermarkets.map((supermarket) => (
          <Marker
            key={`${supermarket.latitude}-${supermarket.longitude}`}
            position={{ lat: supermarket.latitude, lng: supermarket.longitude }}
            icon={getMarkerIcon(supermarket.status)}
            onClick={() => handleMarkerClick(supermarket)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-3 min-w-[250px]">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{selectedMarker.chain}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedMarker.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedMarker.status === 'open' ? 'Open' : 'Gesloten'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{selectedMarker.name}</p>
              <div className="text-sm mb-2">
                <p>{selectedMarker.address}</p>
                <p>{selectedMarker.postalCode} {selectedMarker.city}</p>
              </div>
              {selectedMarker.incident && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <p className="text-xs font-medium text-red-800">Gemeld incident:</p>
                  <p className="text-xs text-red-700">{selectedMarker.incident.description}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Laatst bijgewerkt: {new Date(selectedMarker.lastUpdated).toLocaleString('nl-NL')}
              </p>
              <Button
                onClick={() => openInGoogleMaps(selectedMarker)}
                size="sm"
                className="mt-3 w-full flex items-center gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Maps
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Legend */}
      <Card className="absolute top-4 left-4 p-4 z-10">
        <h4 className="font-semibold mb-2">Status</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-sm">Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-sm">Gesloten</span>
          </div>
        </div>
      </Card>c
    </div>
  );
};

export default Map;