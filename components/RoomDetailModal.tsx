import React, { useState } from 'react';
import { RoomListing, RoomType, Amenity, SuitableFor } from '../types';
import { XIcon, CheckCircleIcon, MapPinIcon, WifiIcon, ParkingIcon, BathroomIcon, KitchenIcon, AcIcon, FurnishedIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, MessageIcon } from './icons/Icons';

interface RoomDetailModalProps {
  room: RoomListing;
  onClose: () => void;
  onViewOnMap: (location: { lat: number; lng: number }, title: string) => void;
  onStartChat: (listing: RoomListing) => void;
}

const amenityIconMap: Record<Amenity, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [Amenity.WIFI]: WifiIcon,
    [Amenity.PARKING]: ParkingIcon,
    [Amenity.BATHROOM]: BathroomIcon,
    [Amenity.KITCHEN]: KitchenIcon,
    [Amenity.AC]: AcIcon,
    [Amenity.FURNISHED]: FurnishedIcon,
};

const AMENITY_LABELS: Record<Amenity, string> = {
    [Amenity.WIFI]: 'WiFi',
    [Amenity.PARKING]: 'Parking',
    [Amenity.BATHROOM]: 'Attached Bathroom',
    [Amenity.KITCHEN]: 'Kitchen Access',
    [Amenity.AC]: 'Air Conditioning',
    [Amenity.FURNISHED]: 'Furnished',
};

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.SINGLE_ROOM]: 'Single Room',
  [RoomType.SHARED]: 'Shared Room',
  [RoomType.FLAT]: 'Entire Flat',
  [RoomType.ROOM_KITCHEN]: 'Room + Kitchen',
  [RoomType.APARTMENT]: 'Apartment',
  [RoomType.HOTEL]: 'Hotel Room',
  [RoomType.HOSTEL]: 'Hostel Stay',
};

const SUITABLE_FOR_LABELS: Record<SuitableFor, string> = {
    [SuitableFor.STUDENTS]: 'Students',
    [SuitableFor.FAMILY]: 'Family',
    [SuitableFor.PROFESSIONALS]: 'Professionals',
};


const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, onClose, onViewOnMap, onStartChat }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % room.imageUrls.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + room.imageUrls.length) % room.imageUrls.length);
  };

  const handleMapClick = () => {
      if(room.location) {
          onClose(); // Close this modal first
          setTimeout(() => onViewOnMap(room.location!, room.title), 100); // Open map modal after a short delay
      }
  }
  
  const handleChatClick = () => {
    onStartChat(room);
  };

  const getAvailableDate = () => {
    if (!room.availableFrom) return null;
    const date = room.availableFrom.toDate ? room.availableFrom.toDate() : new Date(room.availableFrom);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formattedAvailableDate = getAvailableDate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-20 bg-black/30 hover:bg-black/50 rounded-full p-1">
          <XIcon />
        </button>

        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 relative lg:rounded-l-2xl overflow-hidden flex-shrink-0">
          <img src={room.imageUrls[currentImageIndex]} alt={`${room.title} image ${currentImageIndex + 1}`} className="w-full h-60 lg:h-full object-cover" />
          {room.imageUrls.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-opacity">
                <ChevronLeftIcon />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-opacity">
                <ChevronRightIcon />
              </button>
            </>
          )}
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {room.imageUrls.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}></div>
            ))}
           </div>
        </div>

        {/* Details Section */}
        <div className="w-full lg:w-1/2 flex flex-col p-6 overflow-y-auto">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">{ROOM_TYPE_LABELS[room.roomType]}</span>
              {room.isVerified && (
                  <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      Verified
                  </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{room.title}</h2>
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-2">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0"/>
                <span>{room.address}, {room.city}</span>
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 my-4"></div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{room.description}</p>
          
          <div className="border-t dark:border-gray-700 my-4"></div>

          {/* Availability */}
          {formattedAvailableDate && (
              <>
                <div>
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Availability</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        This room is available from <strong>{formattedAvailableDate}</strong>.
                    </p>
                </div>
                <div className="border-t dark:border-gray-700 my-4"></div>
              </>
          )}


          {/* Amenities */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
                {room.amenities.map(amenity => {
                    const Icon = amenityIconMap[amenity];
                    return (
                        <div key={amenity} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            {Icon && <Icon className="h-5 w-5 mr-2 text-indigo-500" />}
                            <span>{AMENITY_LABELS[amenity]}</span>
                        </div>
                    );
                })}
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 my-4"></div>
          
           {/* Suitable For */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Suitable For</h3>
            <div className="flex flex-wrap gap-2">
                {room.suitableFor.map(s => (
                    <span key={s} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{SUITABLE_FOR_LABELS[s]}</span>
                ))}
            </div>
          </div>


          {/* Sticky Footer for actions */}
          <div className="mt-auto pt-6">
             <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {room.price.toLocaleString('en-NP')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/ month</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <a href={`tel:${room.contact.phone}`} className="p-3 rounded-full font-semibold text-sm transition-colors text-green-600 bg-green-100 hover:bg-green-200 dark:bg-gray-700 dark:text-green-400 dark:hover:bg-gray-600">
                        <PhoneIcon />
                    </a>
                    <button onClick={handleChatClick} className="w-full flex-grow flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors text-white bg-indigo-600 hover:bg-indigo-700">
                       <MessageIcon className="h-5 w-5" />
                       Chat with Owner
                    </button>
                 </div>
             </div>
             <button
               onClick={handleMapClick}
               disabled={!room.location}
               className="w-full mt-2 px-4 py-3 rounded-lg font-semibold text-sm transition-colors text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               View on Map
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;
