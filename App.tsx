// Fix: Replaced placeholder content with a fully functional App component.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
import firebase from 'firebase/compat/app';
import { auth, db } from './firebase/config';
import { RoomListing, Filters, UserProfile } from './types';
import { CITIES_BY_COUNTRY, COUNTRIES } from './constants';
import { Language, t } from './utils/i18n';

import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import RoomCard from './components/RoomCard';
import MapModal from './components/MapModal';
import AuthModal from './components/AuthModal';
import LegalModal from './components/LegalModal';
import AdminPanel from './components/AdminPanel'; // Import AdminPanel
import { FilterIcon, MapPinIcon, PlusIcon } from './components/icons/Icons';
import RoomDetailModal from './components/RoomDetailModal';
import ProfileModal from './components/ProfileModal';
import ListRoomModal from './components/ListRoomModal';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

const initialFilters: Filters = {
  country: 'NEPAL',
  city: 'all',
  minPrice: null,
  maxPrice: null,
  roomTypes: [],
  amenities: [],
  suitableFor: [],
  searchTerm: '',
};

// NOTE: In a real app, this should be stored in an environment variable
const ADMIN_UID = 'UrH1D9UX7YSjt9KyOc7fXDwA8jl1'; // Replace with your actual Firebase Admin UID

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (storedPrefs === 'light' || storedPrefs === 'dark') {
      return storedPrefs;
    }
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light'; // default to light
};

const haversineDistance = (coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
};
const NEARBY_RADIUS_KM = 10; // 10km radius for "nearby" rooms


function App() {
  const [allRooms, setAllRooms] = useState<RoomListing[]>([]);
  // Fix: Added missing '=' to correct the useState declaration syntax.
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  // Fix: Use Firebase v8 User type.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [lang, setLang] = useState<Language>('en');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isListRoomModalOpen, setIsListRoomModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapModalData, setMapModalData] = useState<{location: {lat: number, lng: number}, title: string} | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalContent, setLegalModalContent] = useState({title: '', content: <></>});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomListing | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationFilterActive, setIsLocationFilterActive] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isAdmin = user?.uid === ADMIN_UID;

  const fetchAllRooms = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from Firestore
      const snapshot = await db.collection('rooms').orderBy('listedDate', 'desc').get();
      const roomsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to JS Date
          listedDate: data.listedDate?.toDate ? data.listedDate.toDate() : new Date(), 
        } as RoomListing;
      });
      setAllRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms from Firestore: ", error);
      setAllRooms([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRooms();
  }, [fetchAllRooms]);
  
  useEffect(() => {
    // Fix: Use Firebase v8 syntax for auth state changes.
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Log the UID to the console to make it easy for the admin to find their UID
        console.log("Your Firebase User ID (UID) is:", currentUser.uid);

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setIsLocationFilterActive(true); // Activate filter automatically
                    setLocationError(null);
                },
                (error) => {
                    console.warn(`Geolocation error: ${error.message}`);
                    setLocationError("Could not get your location. Showing default results.");
                    setIsLocationFilterActive(false);
                }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
        }
        
        // Check for user profile in Firestore
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          // If it's a new user, create a profile document
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email!,
            photoURL: currentUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: currentUser.uid === ADMIN_UID ? 'admin' : 'user',
          };
          await userDocRef.set(newProfile);
          setUserProfile(newProfile);
        } else {
          // Existing user, load profile from Firestore
          setUserProfile(userDoc.data() as UserProfile);
        }

      } else {
        setUserProfile(null);
        // Reset location state on logout
        setUserLocation(null);
        setIsLocationFilterActive(false);
        setLocationError(null);
      }

      if(currentUser?.uid !== ADMIN_UID) {
        setIsAdminView(false); // Ensure non-admins are kicked out of admin view
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
  }, [theme]);

  // SEO Effect for dynamic titles, descriptions, and structured data
  useEffect(() => {
    const defaultTitle = 'Sajilo Rent | Find Rooms, Flats, and Apartments for Rent';
    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    const defaultDescription = metaDescriptionTag ? metaDescriptionTag.getAttribute('content') : '';

    if (selectedRoom) {
        // Update title
        document.title = `${selectedRoom.title} | Sajilo Rent`;

        // Update meta description
        if (metaDescriptionTag) {
            const descriptionSnippet = selectedRoom.description.substring(0, 160).replace(/"/g, '&quot;') + '...';
            metaDescriptionTag.setAttribute('content', descriptionSnippet);
        }
        
        // Add structured data for the listing
        const roomLdJson = {
            "@context": "https://schema.org",
            "@type": "Apartment", // General type, can be more specific
            "name": selectedRoom.title,
            "description": selectedRoom.description,
            "image": selectedRoom.imageUrls,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": selectedRoom.address,
                "addressLocality": selectedRoom.city,
                "addressCountry": selectedRoom.country
            },
            ...(selectedRoom.location && {
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": selectedRoom.location.lat,
                    "longitude": selectedRoom.location.lng
                }
            }),
            "offers": {
                "@type": "Offer",
                "price": selectedRoom.price,
                "priceCurrency": selectedRoom.country === 'NEPAL' ? "NPR" : "INR",
                "availability": selectedRoom.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
        };
        
        const roomScriptElement = document.createElement('script');
        roomScriptElement.type = 'application/ld+json';
        roomScriptElement.id = 'room-ld-json';
        roomScriptElement.innerHTML = JSON.stringify(roomLdJson);
        document.head.appendChild(roomScriptElement);
    }

    return () => {
        // Cleanup function to restore original values
        document.title = defaultTitle;
        if (metaDescriptionTag && defaultDescription) {
            metaDescriptionTag.setAttribute('content', defaultDescription);
        }
        const existingRoomScript = document.getElementById('room-ld-json');
        if (existingRoomScript) {
            document.head.removeChild(existingRoomScript);
        }
    };
}, [selectedRoom]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setIsLocationFilterActive(false); // Disable location filter on manual change
    setFilters(prev => {
        const updatedFilters = { ...prev, ...newFilters };
        // If country is changed, reset city to 'all'
        if (newFilters.country && newFilters.country !== prev.country) {
            updatedFilters.city = 'all';
        }
        return updatedFilters;
    });
  };

  const handleResetFilters = () => {
    setIsLocationFilterActive(false); // Also disable on reset
    setFilters(prev => ({ ...initialFilters, country: prev.country }));
  }

  const clearLocationFilter = () => {
    setIsLocationFilterActive(false);
    setLocationError(null);
  };

  const handleViewOnMap = (location: { lat: number; lng: number }, title: string) => {
    setMapModalData({ location, title });
    setIsMapModalOpen(true);
  };
  
  const handleLogout = async () => {
    try {
      // Fix: Use Firebase v8 syntax for sign out.
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const handleOpenLegalModal = (type: 'terms' | 'privacy') => {
    if (type === 'terms') {
      setLegalModalContent({ title: 'Terms of Service', content: <TermsOfService />});
    } else {
      setLegalModalContent({ title: 'Privacy Policy', content: <PrivacyPolicy />});
    }
    setIsLegalModalOpen(true);
  };
  
  const handleSelectRoom = (room: RoomListing) => {
    setSelectedRoom(room);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };
  
  const handleRoomListed = (newRoom: RoomListing) => {
    // Add the new room to the top of the list for immediate visibility
    setAllRooms(prevRooms => [newRoom, ...prevRooms]);
  };

  const handleAdminPanelClose = () => {
    setIsAdminView(false);
    fetchAllRooms(); // Re-fetch data when admin panel is closed to see changes
  };

  const filteredListings = useMemo(() => {
    let result = allRooms.filter(room => room.country === filters.country);

    // If location filter is active, it takes precedence
    if (isLocationFilterActive && userLocation) {
        result = result.filter(room => 
            room.location && haversineDistance(userLocation, room.location) <= NEARBY_RADIUS_KM
        );
    } else {
        // Otherwise, apply standard filters
        // Fix: Corrected typo in destructuring assignment from `=>` to `=`.
        result = result.filter(room => {
            const { city, minPrice, maxPrice, roomTypes, amenities, suitableFor, searchTerm } = filters;
            if (city !== 'all' && room.city !== city) return false;
            if (minPrice && room.price < minPrice) return false;
            if (maxPrice && room.price > maxPrice) return false;
            if (roomTypes.length > 0 && !roomTypes.includes(room.roomType)) return false;
            if (amenities.length > 0 && !amenities.every(a => room.amenities.includes(a))) return false;
            if (suitableFor.length > 0 && !suitableFor.some(s => room.suitableFor && room.suitableFor.includes(s))) return false;
            if (searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                if (
                    !room.title.toLowerCase().includes(searchLower) &&
                    !room.address.toLowerCase().includes(searchLower) &&
                    !room.description.toLowerCase().includes(searchLower)
                ) {
                    return false;
                }
            }
            return true;
        });
    }
    
    // Sort by date descending
    return result.sort((a, b) => (b.listedDate as Date).getTime() - (a.listedDate as Date).getTime());

  }, [allRooms, filters, isLocationFilterActive, userLocation]);

  if (isAdminView && isAdmin) {
    return <AdminPanel onClose={handleAdminPanelClose} />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300 flex flex-col ${isMapModalOpen || isAuthModalOpen || selectedRoom || isProfileModalOpen || isListRoomModalOpen ? 'overflow-hidden' : ''}`}>
      <Header
        user={user}
        userProfile={userProfile}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onListRoomClick={() => setIsListRoomModalOpen(true)}
        onMessagesClick={() => alert('Chat feature is coming soon!')}
        theme={theme}
        onThemeChange={setTheme}
        lang={lang}
        onLangChange={setLang}
        isAdmin={isAdmin}
        onAdminPanelClick={() => setIsAdminView(true)}
        onOpenLegalModal={handleOpenLegalModal}
        filters={filters}
        onFilterChange={handleFilterChange}
        cities={CITIES_BY_COUNTRY[filters.country]}
        countries={COUNTRIES}
      />
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <aside className="hidden lg:block lg:col-span-3">
              <FilterPanel 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                  lang={lang}
              />
            </aside>

            <div className="lg:col-span-9">
              {isAdmin && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-between shadow-lg">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">Admin: List a new room?</h3>
                    <p className="mt-1 opacity-90">Add a new listing to the platform directly from here.</p>
                  </div>
                  <button 
                    onClick={() => setIsListRoomModalOpen(true)}
                    className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0 bg-white text-indigo-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                  >
                    List a Room
                  </button>
                </div>
              )}
              {isLocationFilterActive && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                            Showing rooms within {NEARBY_RADIUS_KM}km of your current location.
                        </p>
                    </div>
                    <button onClick={clearLocationFilter} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Clear
                    </button>
                </div>
              )}
              {locationError && !isLocationFilterActive && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{locationError}</p>
                </div>
              )}
              <div className="mt-6">
                {loading ? (
                   <div className="text-center py-10">
                    <p className="text-gray-600 dark:text-gray-300">{t('loading', lang)}</p>
                  </div>
                ) : filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredListings.map(room => (
                      <RoomCard key={room.id} room={room} onViewOnMap={handleViewOnMap} onSelectRoom={handleSelectRoom} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('no_results_title', lang)}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{ isLocationFilterActive ? "No rooms found near you. Try clearing the location filter." : t('no_results_desc', lang)}</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </main>
      
      {/* Mobile action buttons */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30 flex flex-col-reverse items-end gap-4">
        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110"
          aria-label="Open Filters"
        >
          <FilterIcon />
        </button>
        {isAdmin && (
          <button
            onClick={() => setIsListRoomModalOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110"
            aria-label="List a Room"
          >
            <PlusIcon />
          </button>
        )}
      </div>

      {/* Mobile Filter Panel */}
      {isFilterPanelOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsFilterPanelOpen(false)}>
           <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <FilterPanel 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={() => { handleResetFilters(); setIsFilterPanelOpen(false); }}
                  lang={lang}
              />
           </div>
        </div>
      )}


      {isMapModalOpen && mapModalData && (
        <MapModal 
          location={mapModalData.location}
          title={mapModalData.title}
          onClose={() => setIsMapModalOpen(false)}
        />
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onOpenLegalModal={handleOpenLegalModal} />}
      
      {isLegalModalOpen && <LegalModal title={legalModalContent.title} onClose={() => setIsLegalModalOpen(false)}>{legalModalContent.content}</LegalModal>}
      
      {selectedRoom && (
        <RoomDetailModal 
            room={selectedRoom} 
            onClose={() => setSelectedRoom(null)}
            onViewOnMap={handleViewOnMap}
            onStartChat={() => alert('Chat feature is coming soon!')}
        />
      )}

      {isProfileModalOpen && userProfile && (
        <ProfileModal
          userProfile={userProfile}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {isListRoomModalOpen && userProfile && (
        <ListRoomModal 
            onClose={() => setIsListRoomModalOpen(false)} 
            onRoomCreated={handleRoomListed} 
            userProfile={userProfile}
            initialCountry={filters.country}
        />
      )}
      
    </div>
  );
}

export default App;