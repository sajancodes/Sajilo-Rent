import React, { useEffect, useRef, useState } from 'react';
import { XIcon, FullScreenIcon, ExitFullScreenIcon } from './icons/Icons';

// This tells TypeScript that we expect 'L' to be a global variable (from the Leaflet CDN script)
declare var L: any;

interface MapModalProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  title: string;
}

const MapModal: React.FC<MapModalProps> = ({ location, onClose, title }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && location) {
      mapRef.current = L.map(mapContainerRef.current).setView([location.lat, location.lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      L.marker([location.lat, location.lng]).addTo(mapRef.current)
        .bindPopup(title)
        .openPopup();
    }

    // Cleanup function to remove the map instance when the component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location, title]);

  // Effect to resize map on fullscreen toggle
  useEffect(() => {
    if (mapRef.current) {
        // Delay to allow CSS transition to complete before resizing
        setTimeout(() => {
            mapRef.current.invalidateSize();
        }, 300);
    }
  }, [isFullScreen]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center ${!isFullScreen ? 'p-4' : ''}`}>
      <div className={`bg-white dark:bg-gray-800 shadow-2xl w-full flex flex-col relative transition-all duration-300 ease-in-out ${isFullScreen ? 'h-full rounded-none' : 'rounded-lg max-w-2xl h-3/4'}`}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate pr-4">Location: {title}</h2>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" aria-label="Toggle Fullscreen">
                    {isFullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
                </button>
                <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" aria-label="Close Map">
                    <XIcon />
                </button>
            </div>
        </div>
        <div ref={mapContainerRef} className="w-full flex-grow" id="map"></div>
      </div>
    </div>
  );
};

export default MapModal;
