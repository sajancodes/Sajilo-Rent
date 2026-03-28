import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from './icons/Icons';

declare var L: any; // Leaflet global, now also for esri-leaflet

// Fix Leaflet default icon path issues
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface LocationPickerModalProps {
  onClose: () => void;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number };
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ onClose, onLocationSelect, initialCenter }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialCenter || null);

  useEffect(() => {
    const defaultCenter = initialCenter || { lat: 27.7172, lng: 85.3240 }; // Default to Kathmandu
    
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([defaultCenter.lat, defaultCenter.lng], 13);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }).addTo(mapRef.current);

      // Add roads and labels on top of imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Labels &copy; Esri',
      }).addTo(mapRef.current);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Transportation &copy; Esri',
      }).addTo(mapRef.current);

      // Add draggable marker
      markerRef.current = L.marker([defaultCenter.lat, defaultCenter.lng], {
        draggable: true,
      }).addTo(mapRef.current);
      
      if (!selectedCoords) {
        setSelectedCoords(defaultCenter);
      }

      // Add search control with retry logic to handle race conditions during script loading
      let searchRetryCount = 0;
      const maxRetries = 10;

      const initSearchControl = () => {
        if (!mapRef.current) return;

        const esri = (L as any).esri;
        if (esri && esri.Geocoding && esri.Geocoding.geosearch) {
          try {
            const searchControl = esri.Geocoding.geosearch({
              position: 'topright',
              placeholder: 'Search for an address or place',
              useMapBounds: false, // Search globally
              providers: [
                  esri.Geocoding.arcgisOnlineProvider({
                      // You can add an API key here if you have one for higher usage limits
                  })
              ]
            }).addTo(mapRef.current);

            // Listen for search results
            searchControl.on('results', (data: any) => {
              if (data.results && data.results.length > 0) {
                  const { lat, lng } = data.results[0].latlng;
                  markerRef.current.setLatLng([lat, lng]);
                  mapRef.current.setView([lat, lng], 16); // Zoom in closer on search result
                  setSelectedCoords({ lat, lng });
              }
            });
          } catch (e) {
            console.error("Geocoding failed to initialize", e);
          }
        } else if (searchRetryCount < maxRetries) {
          searchRetryCount++;
          setTimeout(initSearchControl, 500);
        } else {
          console.error("Geocoding failed to initialize after retries. L.esri is undefined or missing Geocoding.");
        }
      };

      initSearchControl();

      // Update marker and state on drag
      markerRef.current.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        setSelectedCoords({ lat: position.lat, lng: position.lng });
      });

      // Also update on map click
      mapRef.current.on('click', (event: any) => {
        const { lat, lng } = event.latlng;
        markerRef.current.setLatLng([lat, lng]);
        setSelectedCoords({ lat, lng });
      });
    }

    // Invalidate map size to ensure it renders correctly after modal animation
    const timeoutIds = [100, 300, 500].map(ms => 
        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, ms)
    );

    return () => {
      timeoutIds.forEach(clearTimeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialCenter]);

  const handleConfirm = () => {
    // Use the explicitly selected coordinates, or fall back to the marker's current position
    const finalCoords = selectedCoords || markerRef.current.getLatLng();
    onLocationSelect(finalCoords);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-3/4 flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Select Location</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" aria-label="Close Map">
            <XIcon />
          </button>
        </div>
        <div className="relative flex-grow">
          <div ref={mapContainerRef} className="absolute inset-0" id="location-picker-map"></div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/80 p-2 rounded-md shadow-lg text-xs text-gray-700 dark:text-gray-200 pointer-events-none z-[1000]">
            Drag the marker or click on the map to set the location.
          </div>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex-shrink-0 flex justify-end items-center space-x-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCoords ? `Lat: ${selectedCoords.lat.toFixed(4)}, Lng: ${selectedCoords.lng.toFixed(4)}` : 'No location selected'}
            </div>
            <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Confirm Location
            </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
