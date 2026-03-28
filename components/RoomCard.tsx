
import React from 'react';
import { RoomListing, RoomType, Amenity } from '../types';
import { StarIcon, CheckCircleIcon, MapPinIcon, WifiIcon, ParkingIcon, BathroomIcon, KitchenIcon, AcIcon, FurnishedIcon } from './icons/Icons';

interface RoomCardProps {
  room: RoomListing;
  onViewOnMap: (location: { lat: number; lng: number }, title: string) => void;
  onSelectRoom: (room: RoomListing) => void;
}

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.SINGLE_ROOM]: 'Single Room',
  [RoomType.SHARED]: 'Shared Room',
  [RoomType.FLAT]: 'Entire Flat',
  [RoomType.ROOM_KITCHEN]: 'Room + Kitchen',
  [RoomType.APARTMENT]: 'Apartment',
  [RoomType.HOTEL]: 'Hotel Room',
  [RoomType.HOSTEL]: 'Hostel Stay',
};

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

const RoomCard: React.FC<RoomCardProps> = ({ room, onViewOnMap, onSelectRoom }) => {
  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-NP')}`;
  };

  const getRoomTypeLabel = (type: RoomType) => {
    return ROOM_TYPE_LABELS[type] || 'Room';
  }

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    if(room.location) {
        onViewOnMap(room.location, room.title);
    }
  }

  const handleRentNowClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    alert('Payment gateway integration is coming soon!');
  }

  const renderAvailabilityOverlay = () => {
    if (room.isAvailable) {
      return null;
    }

    // Firestore timestamps might be objects with toDate(), or they could be ISO strings from mock data
    const availableDate = room.availableFrom ? (room.availableFrom.toDate ? room.availableFrom.toDate() : new Date(room.availableFrom)) : null;
    const now = new Date();

    if (availableDate && availableDate > now) {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2">
          <span className="text-white text-center text-sm font-bold">
            Available from<br />{availableDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <span className="text-white text-lg font-bold">Rented Out</span>
      </div>
    );
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => onSelectRoom(room)}
    >
      <div className="relative">
        <img className="w-full h-40 object-cover" src={room.imageUrls[0]} alt={room.title} />
        {room.isVerified && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" />
            Verified
          </div>
        )}
        {renderAvailabilityOverlay()}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">{getRoomTypeLabel(room.roomType)}</p>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <StarIcon className="text-yellow-400 mr-1" />
                <span className="font-bold">{room.rating.toFixed(1)}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">({room.reviews})</span>
            </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-1 truncate">{room.title}</h3>
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
          <MapPinIcon className="h-4 w-4 mr-1"/>
          <span>{room.address}, {room.city}</span>
        </div>
        
        <div className="mt-4 flex-grow">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                {room.amenities.slice(0, 5).map(amenity => {
                    const Icon = amenityIconMap[amenity];
                    return Icon ? (
                      <div key={amenity} title={AMENITY_LABELS[amenity]}>
                          <Icon className="h-5 w-5" />
                      </div>
                    ) : null;
                })}
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(room.price)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">/ month</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
               onClick={handleMapClick}
               disabled={!room.location}
               className="w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               See on Map
             </button>
            <button
               onClick={handleRentNowClick}
               className="w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-white bg-indigo-600 hover:bg-indigo-700"
             >
               Rent Now
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;