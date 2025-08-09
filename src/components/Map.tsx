import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupermarketData } from '@/types/supermarket';

interface MapProps {
  supermarkets: SupermarketData[];
  searchQuery: string;
  onSupermarketSelect: (supermarket: SupermarketData) => void;
}

const Map: React.FC<MapProps> = ({ supermarkets, searchQuery, onSupermarketSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [5.2913, 52.1326], // Netherlands center
      zoom: 7,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add markers for supermarkets
    supermarkets.forEach((supermarket) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'supermarket-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      
      const statusColor = supermarket.status === 'open' ? '#22c55e' : 
                         supermarket.status === 'closed' ? '#ef4444' : '#eab308';
      el.style.backgroundColor = statusColor;

      // Create popup content
      const statusText = supermarket.status === 'open' ? 'Inzameling Open' : 
                        supermarket.status === 'closed' ? 'Inzameling Gesloten' : 'Status Onbekend';
      
      const popupContent = `
        <div class="p-3 min-w-[250px]">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-lg">${supermarket.chain}</h3>
            <span class="px-2 py-1 text-xs rounded-full ${
              supermarket.status === 'open' ? 'bg-green-100 text-green-800' :
              supermarket.status === 'closed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }">${statusText}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">${supermarket.name}</p>
          <div class="text-sm mb-2">
            <p>${supermarket.address}</p>
            <p>${supermarket.postalCode} ${supermarket.city}</p>
          </div>
          ${supermarket.incident ? `
            <div class="bg-red-50 border border-red-200 rounded p-2 mt-2">
              <p class="text-xs font-medium text-red-800">Gemeld incident:</p>
              <p class="text-xs text-red-700">${supermarket.incident.description}</p>
            </div>
          ` : ''}
          <p class="text-xs text-gray-500 mt-2">
            Laatst bijgewerkt: ${new Date(supermarket.lastUpdated).toLocaleString('nl-NL')}
          </p>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      el.addEventListener('click', () => {
        onSupermarketSelect(supermarket);
      });

      new mapboxgl.Marker(el)
        .setLngLat([supermarket.longitude, supermarket.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, supermarkets, onSupermarketSelect]);

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Mapbox Configuratie</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Voer uw Mapbox publieke token in om de kaart weer te geven. U kunt er een krijgen op{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <Input
            type="password"
            placeholder="Voer Mapbox publieke token in"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4"
          />
          <Button 
            onClick={() => setShowTokenInput(false)} 
            disabled={!mapboxToken}
            className="w-full"
          >
            Kaart Initialiseren
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Legend */}
      <Card className="absolute top-4 left-4 p-4 z-10">
        <h4 className="font-semibold mb-2">Status Legenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-open"></div>
            <span className="text-sm">Inzameling Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-closed"></div>
            <span className="text-sm">Inzameling Gesloten</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-unknown"></div>
            <span className="text-sm">Status Onbekend</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Map;