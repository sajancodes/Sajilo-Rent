import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { XIcon, SparklesIcon, MapPinIcon } from './icons/Icons';
import { RoomType, Amenity, SuitableFor, RoomListing, UserProfile, Country } from '../types';
import { CITIES_BY_COUNTRY, COUNTRIES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import LocationPickerModal from './LocationPickerModal';


const amenityOptions: { id: Amenity; label: string }[] = [
    { id: Amenity.WIFI, label: 'WiFi' },
    { id: Amenity.PARKING, label: 'Parking' },
    { id: Amenity.BATHROOM, label: 'Attached Bathroom' },
    { id: Amenity.KITCHEN, label: 'Kitchen Access' },
    { id: Amenity.AC, label: 'Air Conditioning' },
    { id: Amenity.FURNISHED, label: 'Furnished' },
];

const suitableForOptions: { id: SuitableFor; label: string }[] = [
    { id: SuitableFor.STUDENTS, label: 'Students' },
    { id: SuitableFor.FAMILY, label: 'Family' },
    { id: SuitableFor.PROFESSIONALS, label: 'Professionals' },
];


interface ListRoomModalProps {
  onClose: () => void;
  onRoomCreated: (newRoom: RoomListing) => void;
  onRoomUpdated?: (updatedRoom: RoomListing) => void;
  userProfile: UserProfile | null;
  initialCountry: Country;
  roomToEdit?: RoomListing | null;
}

const ListRoomModal: React.FC<ListRoomModalProps> = ({ onClose, onRoomCreated, onRoomUpdated, userProfile, initialCountry, roomToEdit }) => {
  const isEditMode = !!roomToEdit;

  const getInitialFormData = () => {
    if (isEditMode && roomToEdit) {
      // Helper to convert Firestore Timestamp or any date representation to 'yyyy-mm-dd'
      const formatDateForInput = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return ''; // Invalid date
        return d.toISOString().split('T')[0];
      };

      return {
        country: roomToEdit.country,
        title: roomToEdit.title,
        description: roomToEdit.description,
        address: roomToEdit.address,
        city: roomToEdit.city,
        price: roomToEdit.price.toString(),
        roomType: roomToEdit.roomType,
        amenities: roomToEdit.amenities,
        suitableFor: roomToEdit.suitableFor,
        contactName: roomToEdit.contact.name,
        contactPhone: roomToEdit.contact.phone,
        lat: roomToEdit.location?.lat.toString() || '',
        lng: roomToEdit.location?.lng.toString() || '',
        availableFrom: formatDateForInput(roomToEdit.availableFrom),
      };
    }
    return {
      country: initialCountry,
      title: '',
      description: '',
      address: '',
      city: CITIES_BY_COUNTRY[initialCountry][0],
      price: '',
      roomType: RoomType.SINGLE_ROOM,
      amenities: [] as Amenity[],
      suitableFor: [] as SuitableFor[],
      contactName: userProfile?.name || '',
      contactPhone: '',
      lat: '',
      lng: '',
      availableFrom: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') {
      const newCountry = value as Country;
      setFormData(prev => ({ 
        ...prev, 
        country: newCountry,
        city: CITIES_BY_COUNTRY[newCountry][0] 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCheckboxChange = <T extends string>(field: 'amenities' | 'suitableFor', value: T) => {
    const currentValues = formData[field] as T[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData(prev => ({ ...prev, [field]: newValues }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          setError(`Error getting location: ${error.message}. Please enter manually or check site permissions.`);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    setFormData(prev => ({
        ...prev,
        lat: coords.lat.toString(),
        lng: coords.lng.toString(),
    }));
    setIsLocationPickerOpen(false);
  };

  const handleGenerateWithAI = async () => {
      if (!aiKeywords) {
          setError("Please provide some keywords for the AI.");
          return;
      }
      setIsGenerating(true);
      setError(null);
      try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = `Generate a compelling and attractive title and a detailed description for a room rental listing in ${formData.country} based on these keywords: "${aiKeywords}". The tone should be welcoming and informative. Provide details that a potential renter in that country would find useful.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A short, catchy title for the listing."
              },
              description: {
                type: Type.STRING,
                description: "A detailed description of the room, its features, and the surrounding area."
              }
            }
          };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.title && jsonResponse.description) {
            setFormData(prev => ({
                ...prev,
                title: jsonResponse.title,
                description: jsonResponse.description,
            }));
        } else {
            throw new Error("AI generated an invalid response. Please try again.");
        }

      } catch (err: any) {
          setError(err.message || 'AI generation failed. Please try rephrasing your keywords.');
      } finally {
          setIsGenerating(false);
      }
  };

  const uploadImage = async (file: File): Promise<string> => {
      const CLOUDINARY_CLOUD_NAME = 'dlau1tcii';
      const CLOUDINARY_UPLOAD_PRESET = 'Room Sathi';
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || 'Image upload failed.');
      }
      
      const data = await response.json();
      const uploadedImageUrl = data.secure_url;
      
      if (!uploadedImageUrl || typeof uploadedImageUrl !== 'string') {
        throw new Error("Image URL not found in Cloudinary response.");
      }
      return uploadedImageUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user && !isEditMode) { // User must be logged in for new listings
      setError("You must be logged in to list a room.");
      return;
    }
    if (!imageFile && !isEditMode) {
      setError("Please upload an image for the room.");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
        let imageUrl = isEditMode ? roomToEdit.imageUrls[0] : '';
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const roomDataPayload = {
            country: formData.country,
            title: formData.title,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            price: Number(formData.price),
            roomType: formData.roomType,
            amenities: formData.amenities,
            suitableFor: formData.suitableFor,
            imageUrls: [imageUrl],
            contact: {
                name: formData.contactName,
                phone: formData.contactPhone,
            },
            location: (formData.lat && formData.lng) ? {
                lat: Number(formData.lat),
                lng: Number(formData.lng)
            } : null,
            availableFrom: formData.availableFrom ? firebase.firestore.Timestamp.fromDate(new Date(formData.availableFrom)) : null,
        };

        if (isEditMode && roomToEdit) {
            // Update existing document
            const updatedData = { ...roomToEdit, ...roomDataPayload, location: roomDataPayload.location || undefined, availableFrom: formData.availableFrom ? new Date(formData.availableFrom) : undefined };
            await db.collection('rooms').doc(roomToEdit.id).update(roomDataPayload);
            onRoomUpdated?.(updatedData);
        } else {
            // Create new document
            const newRoomData = {
                ...roomDataPayload,
                rating: 0,
                reviews: 0,
                isVerified: false,
                isAvailable: true,
                listedDate: firebase.firestore.FieldValue.serverTimestamp(),
                listerId: user!.uid,
            };
            const docRef = await db.collection('rooms').add(newRoomData);
            onRoomCreated({
                ...newRoomData,
                id: docRef.id,
                listedDate: new Date(),
                location: newRoomData.location || undefined,
                availableFrom: newRoomData.availableFrom ? newRoomData.availableFrom.toDate() : undefined,
            } as RoomListing);
        }
        onClose();

    } catch (err: any) {
      console.error("Error during listing process:", err);
      setError(err.message || "Failed to list room. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{isEditMode ? 'Edit Room' : 'List Your Room'}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* AI Assistant Section */}
          <div className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-gray-900/50 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500"/>
                AI Assistant
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your room in a few words (e.g., "bright room for student near bus stop") and let AI write the title and description for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input 
                    type="text"
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="Enter keywords here..."
                    className="w-full sm:w-auto flex-grow input-style"
                />
                <button 
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto sm:min-w-[150px]"
                >
                    {isGenerating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                       <>
                        <SparklesIcon className="h-5 w-5 mr-2"/>
                        Generate
                       </>
                    )}
                </button>
            </div>
          </div>


          {/* Form fields */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className="mt-1 w-full input-style" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} required className="mt-1 w-full input-style"></textarea>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <select name="country" id="country" value={formData.country} onChange={handleInputChange} className="mt-1 w-full input-style">
                {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <select name="city" id="city" value={formData.city} onChange={handleInputChange} className="mt-1 w-full input-style">
                {CITIES_BY_COUNTRY[formData.country].map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address / Area</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} required className="mt-1 w-full input-style" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location Coordinates (Optional)</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Provide coordinates to show your room on the map. You can auto-detect, or select it precisely on the map.</p>
            <div className="flex items-center space-x-2">
              <input type="number" step="any" name="lat" placeholder="Latitude" value={formData.lat} onChange={handleInputChange} className="w-full input-style" />
              <input type="number" step="any" name="lng" placeholder="Longitude" value={formData.lng} onChange={handleInputChange} className="w-full input-style" />
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                <button type="button" onClick={handleGetCurrentLocation} className="w-full sm:w-1/2 px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-gray-700 rounded-lg hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                    Auto-detect Location
                </button>
                <button type="button" onClick={() => setIsLocationPickerOpen(true)} className="w-full sm:w-1/2 px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-gray-700 rounded-lg hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap flex items-center justify-center">
                    <MapPinIcon className="h-4 w-4 mr-1" /> Select on Map
                </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (per month)</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleInputChange} required className="mt-1 w-full input-style" />
            </div>
            <div>
              <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type</label>
              <select name="roomType" id="roomType" value={formData.roomType} onChange={handleInputChange} className="mt-1 w-full input-style">
                {Object.entries(RoomType).map(([key, value]) => <option key={key} value={value}>{value.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label>
                <input type="text" name="contactName" id="contactName" value={formData.contactName} onChange={handleInputChange} required className="mt-1 w-full input-style" />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Phone</label>
              <input type="tel" name="contactPhone" id="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required className="mt-1 w-full input-style" />
            </div>
          </div>
          <div>
            <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available From (Optional)</label>
            <input type="date" name="availableFrom" id="availableFrom" value={formData.availableFrom} onChange={handleInputChange} className="mt-1 w-full input-style" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Amenities</h4>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {amenityOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                        <input type="checkbox" checked={formData.amenities.includes(option.id)} onChange={() => handleCheckboxChange('amenities', option.id)} className="checkbox-style" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{option.label}</span>
                    </label>
                ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suitable For</h4>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suitableForOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                        <input type="checkbox" checked={formData.suitableFor.includes(option.id)} onChange={() => handleCheckboxChange('suitableFor', option.id)} className="checkbox-style" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{option.label}</span>
                    </label>
                ))}
            </div>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Image</label>
            <input type="file" name="image" id="image" accept="image/*" onChange={handleImageChange} required={!isEditMode} className="mt-1 w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/40 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60"/>
             {isEditMode && !imageFile && <p className="text-xs text-gray-500 mt-1">Current image will be kept unless a new one is selected.</p>}
             {imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {imageFile.name}</p>}
          </div>
          
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

          <div className="pt-2 sticky bottom-0 bg-white dark:bg-gray-800 pb-4">
             <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : (isEditMode ? 'Save Changes' : 'List My Room')}
            </button>
          </div>
        </form>
        {isLocationPickerOpen && (
            <LocationPickerModal
                onClose={() => setIsLocationPickerOpen(false)}
                onLocationSelect={handleLocationSelect}
                initialCenter={formData.lat && formData.lng ? { lat: Number(formData.lat), lng: Number(formData.lng) } : undefined}
            />
        )}
      </div>
       <style>{`
          .input-style {
            border-radius: 0.5rem;
            border: 1px solid;
            border-color: #D1D5DB; /* gray-300 */
            background-color: white;
            padding: 0.5rem 0.75rem;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            color: #1F2937; /* gray-800 */
          }
          .dark .input-style {
            border-color: #4B5563; /* gray-600 */
            background-color: #374151; /* gray-700 */
            color: #F3F4F6; /* gray-100 */
          }
          .input-style:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            --tw-ring-color: #6366F1; /* indigo-500 */
            border-color: var(--tw-ring-color);
          }
           .checkbox-style {
            height: 1rem;
            width: 1rem;
            border-radius: 0.25rem;
            border-color: #D1D5DB; /* gray-300 */
            color: #4F46E5; /* indigo-600 */
            background-color: #F3F4F6; /* gray-100 */
          }
           .dark .checkbox-style {
               border-color: #4B5563; /* gray-500 */
               background-color: #4B5563; /* gray-600 */
           }
          .checkbox-style:focus {
             --tw-ring-color: #6366F1; /* indigo-500 */
          }
      `}</style>
    </div>
  );
};

export default ListRoomModal;