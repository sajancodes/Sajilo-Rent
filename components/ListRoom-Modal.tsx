import React, { useState, ChangeEvent, FormEvent } from 'react';
import { db, auth } from '../firebase/config';
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { XIcon, SparklesIcon } from './icons/Icons';
import { RoomType, Amenity, SuitableFor, RoomListing } from '../types';
import { NEPALI_CITIES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";


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
  onRoomListed: (newRoom: RoomListing) => void;
}

const ListRoomModal: React.FC<ListRoomModalProps> = ({ onClose, onRoomListed }) => {
  const [formData, setFormData] = useState({
    // Fix: Add missing 'country' property to satisfy RoomListing type.
    country: 'NEPAL' as const,
    title: '',
    description: '',
    address: '',
    city: NEPALI_CITIES[0],
    price: '',
    roomType: RoomType.SINGLE_ROOM,
    amenities: [] as Amenity[],
    suitableFor: [] as SuitableFor[],
    contactName: '',
    contactPhone: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleGenerateWithAI = async () => {
      if (!aiKeywords) {
          setError("Please provide some keywords for the AI.");
          return;
      }
      setIsGenerating(true);
      setError(null);
      try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = `Generate a compelling and attractive title and a detailed description for a room rental listing in Nepal based on these keywords: "${aiKeywords}". The tone should be welcoming and informative. Provide details that a potential renter in Nepal would find useful.`;
        
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


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        setError("You must be logged in to list a room.");
        return;
    }
    if (!imageFile) {
        setError("Please upload an image for the room.");
        return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Step 1: Upload image to Cloudinary.
      const CLOUDINARY_CLOUD_NAME = 'dlau1tcii'; // IMPORTANT: Replace with your Cloudinary cloud name
      const CLOUDINARY_UPLOAD_PRESET = 'Room Sathi'; // IMPORTANT: Replace with your Cloudinary unsigned upload preset
      
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: uploadFormData,
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error('Cloudinary upload error:', errorData);
          throw new Error('Image upload failed. Please check your Cloudinary configuration.');
      }
      
      const data = await response.json();
      const uploadedImageUrl = data.secure_url;

      // Step 2: Add room listing to Firestore, including the Cloudinary image URL.
      const newRoomData = {
        ...formData,
        price: Number(formData.price),
        imageUrls: [uploadedImageUrl],
        rating: 0,
        reviews: 0,
        isVerified: false,
        isAvailable: true,
        contact: {
          name: formData.contactName,
          phone: formData.contactPhone,
        },
        // Fix: Use Firebase v8 syntax for server timestamp.
        listedDate: firebase.firestore.FieldValue.serverTimestamp(),
        listerId: user.uid,
      };
      
      delete (newRoomData as any).contactName;
      delete (newRoomData as any).contactPhone;

      // Fix: Use Firebase v8 syntax for adding a document.
      const docRef = await db.collection('rooms').add(newRoomData);
      
      onRoomListed({
          id: docRef.id,
          ...newRoomData,
          listedDate: new Date(),
      } as RoomListing);
      onClose();

    } catch (err: any) {
      console.error("Error during listing process: ", err);
      setError(err.message || 'Failed to list room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">List Your Room</h2>
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
            <div className="flex items-center space-x-2">
                <input 
                    type="text"
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="Enter keywords here..."
                    className="flex-grow input-style"
                />
                <button 
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address / Tole</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} required className="mt-1 w-full input-style" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <select name="city" id="city" value={formData.city} onChange={handleInputChange} className="mt-1 w-full input-style">
                {NEPALI_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (NPR/month)</label>
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
            <input type="file" name="image" id="image" accept="image/*" onChange={handleImageChange} required className="mt-1 w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/40 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60"/>
             {imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {imageFile.name}</p>}
          </div>
          
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

          <div className="pt-2 sticky bottom-0 bg-white dark:bg-gray-800 pb-4">
             <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex justify-center items-center">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'List My Room'}
            </button>
          </div>
        </form>
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
