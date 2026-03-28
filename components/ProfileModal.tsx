import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { auth } from '../firebase/config';
import { UserProfile } from '../types';
import { XIcon, UserCircleIcon } from './icons/Icons';

interface ProfileModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, onClose, onProfileUpdate }) => {
  const [name, setName] = useState(userProfile.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(userProfile.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setPreviewUrl(userProfile.photoURL || null);
    }
  }, [imageFile, userProfile.photoURL]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("Image file is too large. Please select an image smaller than 2MB.");
          return;
      }
      setImageFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        setError("You are not logged in.");
        return;
    }
    if (!name.trim()) {
        setError("Name cannot be empty.");
        return;
    }
    setLoading(true);
    setError(null);

    try {
        let uploadedImageUrl = userProfile.photoURL || '';

        // Step 1: Upload new image to Cloudinary if one is selected
        if (imageFile) {
            const CLOUDINARY_CLOUD_NAME = 'dlau1tcii';
            const CLOUDINARY_UPLOAD_PRESET = 'Room Sathi';
            
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
                throw new Error(errorData?.error?.message || 'Image upload failed.');
            }
            
            const data = await response.json();
            uploadedImageUrl = data.secure_url;
        }

        // Step 2: Update user profile on Firebase Auth object
        await user.updateProfile({
            displayName: name,
            photoURL: uploadedImageUrl,
        });

        const updatedProfile: UserProfile = {
            ...userProfile,
            name: name,
            photoURL: uploadedImageUrl,
        };
        
        onProfileUpdate(updatedProfile); // Update state in App.tsx
        onClose();

    } catch (err: any) {
        console.error("Error updating profile: ", err);
        setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex flex-col items-center space-y-2">
                <label htmlFor="profile-image-upload" className="cursor-pointer">
                    {previewUrl ? (
                         <img src={previewUrl} alt="Profile Preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800" />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800">
                           <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-500"/>
                        </div>
                    )}
                </label>
                <input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click image to change</p>
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                />
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Cannot be changed)</label>
                <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    value={userProfile.email} 
                    disabled
                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-lg shadow-sm" 
                />
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
            
            <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex justify-center items-center">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;