import React from 'react';
import { Filters, RoomType, Amenity, SuitableFor } from '../types';
import { t, Language } from '../utils/i18n';

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onReset: () => void;
  lang: Language;
}

const amenityOptions = [
    { id: Amenity.WIFI, label: 'WiFi' },
    { id: Amenity.PARKING, label: 'Parking' },
    { id: Amenity.BATHROOM, label: 'Attached Bathroom' },
    { id: Amenity.KITCHEN, label: 'Kitchen Access' },
    { id: Amenity.AC, label: 'Air Conditioning' },
    { id: Amenity.FURNISHED, label: 'Furnished' },
];

const roomTypeOptions = [
    { id: RoomType.SINGLE_ROOM, label: 'Single Room' },
    { id: RoomType.SHARED, label: 'Shared Room' },
    { id: RoomType.FLAT, label: 'Entire Flat' },
    { id: RoomType.ROOM_KITCHEN, label: 'Room + Kitchen' },
    { id: RoomType.APARTMENT, label: 'Apartment' },
    { id: RoomType.HOTEL, label: 'Hotel' },
    { id: RoomType.HOSTEL, label: 'Hostel' },
];

const suitableForOptions = [
    { id: SuitableFor.STUDENTS, label: 'Students' },
    { id: SuitableFor.FAMILY, label: 'Family' },
    { id: SuitableFor.PROFESSIONALS, label: 'Professionals' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onReset, lang }) => {

  const handleCheckboxChange = <T extends string>(field: keyof Filters, value: T) => {
    const currentValues = filters[field] as T[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange({ [field]: newValues } as Partial<Filters>);
  };

  const priceLabel = filters.country === 'NEPAL'
    ? t('price_range_npr', lang)
    : t('price_range_inr', lang);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('filter_options', lang)}</h3>
        <button onClick={onReset} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">{t('reset', lang)}</button>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{priceLabel}</label>
        <div className="flex items-center space-x-2">
            <input 
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) })}
                className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="dark:text-gray-400">-</span>
            <input 
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
                className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
      </div>

      {/* Room Type Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('room_type', lang)}</h4>
        <div className="space-y-2">
            {roomTypeOptions.map(option => (
                <label key={option.id} className="flex items-center">
                    <input
                        type="checkbox"
                        checked={filters.roomTypes.includes(option.id)}
                        onChange={() => handleCheckboxChange('roomTypes', option.id)}
                        className="h-4 w-4 text-indigo-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{option.label}</span>
                </label>
            ))}
        </div>
      </div>

      {/* Amenities Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('amenities', lang)}</h4>
        <div className="space-y-2">
            {amenityOptions.map(option => (
                 <label key={option.id} className="flex items-center">
                    <input
                        type="checkbox"
                        checked={filters.amenities.includes(option.id)}
                        onChange={() => handleCheckboxChange('amenities', option.id)}
                        className="h-4 w-4 text-indigo-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{option.label}</span>
                </label>
            ))}
        </div>
      </div>

      {/* Suitable For Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('suitable_for', lang)}</h4>
        <div className="space-y-2">
            {suitableForOptions.map(option => (
                 <label key={option.id} className="flex items-center">
                    <input
                        type="checkbox"
                        checked={filters.suitableFor.includes(option.id)}
                        onChange={() => handleCheckboxChange('suitableFor', option.id)}
                        className="h-4 w-4 text-indigo-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{option.label}</span>
                </label>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;