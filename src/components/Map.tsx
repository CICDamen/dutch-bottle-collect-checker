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

      el.addEventListener('click', () => {
        onSupermarketSelect(supermarket);
      });

      new mapboxgl.Marker(el)
        .setLngLat([supermarket.longitude, supermarket.latitude])
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
          <h3 className="text-lg font-semibold mb-4">Mapbox Configuration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please enter your Mapbox public token to display the map. You can get one at{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <Input
            type="password"
            placeholder="Enter Mapbox public token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4"
          />
          <Button 
            onClick={() => setShowTokenInput(false)} 
            disabled={!mapboxToken}
            className="w-full"
          >
            Initialize Map
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
        <h4 className="font-semibold mb-2">Status Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-open"></div>
            <span className="text-sm">Collection Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-closed"></div>
            <span className="text-sm">Collection Closed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-unknown"></div>
            <span className="text-sm">Status Unknown</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Map;