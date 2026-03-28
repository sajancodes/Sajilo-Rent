// Fix: Replaced placeholder content with a functional Header component.
import React, { useState, useEffect } from 'react';
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
import firebase from 'firebase/compat/app';
import { GlobeIcon, SunIcon, MoonIcon, UserCircleIcon, LogoutIcon, EllipsisVerticalIcon, FacebookIcon, TwitterIcon, InstagramIcon, PlusIcon, SearchIcon, XIcon, MessageIcon } from './icons/Icons';
import { t, Language } from '../utils/i18n';
import { UserProfile, Filters, Country } from '../types';

interface HeaderProps {
  // Fix: Use Firebase v8 User type.
  user: firebase.User | null;
  userProfile: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  onListRoomClick: () => void;
  onMessagesClick: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  isAdmin: boolean;
  onAdminPanelClick: () => void;
  onOpenLegalModal: (type: 'terms' | 'privacy') => void;
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  cities: string[];
  countries: { id: Country; name: string }[];
}

const Header: React.FC<HeaderProps> = ({ user, userProfile, onLoginClick, onLogoutClick, onProfileClick, onListRoomClick, onMessagesClick, theme, onThemeChange, lang, onLangChange, isAdmin, onAdminPanelClick, onOpenLegalModal, filters, onFilterChange, cities, countries }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);

  // Sync local state if external filter (e.g., reset) changes
  useEffect(() => {
    setSearchTerm(filters.searchTerm);
  }, [filters.searchTerm]);

  // Debounce search term input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.searchTerm) {
        onFilterChange({ searchTerm });
      }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filters.searchTerm, onFilterChange]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ country: e.target.value as Country });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ city: e.target.value });
  };


  const renderAuthControl = () => {
    // State 1: User is logged in, and profile is loaded
    if (user && userProfile) {
      return (
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full flex items-center justify-center h-9 w-9 bg-gray-200 dark:bg-gray-700 hover:ring-2 hover:ring-indigo-500 transition">
             {userProfile.photoURL ? (
               <img src={userProfile.photoURL} alt="Profile" className="h-full w-full rounded-full object-cover" />
             ) : (
               <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
             )}
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20" onMouseLeave={() => setIsMenuOpen(false)}>
              <div className="px-4 py-2 border-b dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userProfile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile.email}</p>
              </div>
               <a href="#" onClick={(e) => { e.preventDefault(); onProfileClick(); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                 <UserCircleIcon className="mr-2" />
                 My Profile
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); onLogoutClick(); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                 <LogoutIcon className="mr-2" />
                 {t('logout', lang)}
              </a>
            </div>
          )}
        </div>
      );
    }
    
    // State 2: User is logged in, but profile is still fetching
    if (user && !userProfile) {
        return (
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        );
    }

    // State 3: User is logged out
    return (
        <button onClick={onLoginClick} className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-gray-700 rounded-lg hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors">
          {t('login', lang)}
        </button>
    );
  }

  const toggleTheme = () => {
    onThemeChange(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLang = () => {
    onLangChange(lang === 'en' ? 'ne' : lang === 'ne' ? 'hi' : 'en');
  }

  const SearchBarComponent = (
    <div className="w-full flex items-center border border-gray-300 dark:border-gray-600 rounded-full shadow-sm bg-white dark:bg-gray-700 transition-shadow focus-within:ring-2 focus-within:ring-indigo-500">
      <select value={filters.country} onChange={handleCountryChange} className="bg-transparent pl-4 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none appearance-none cursor-pointer" aria-label="Select Country">
        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
      <select value={filters.city} onChange={handleCityChange} className="bg-transparent pl-3 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none appearance-none cursor-pointer" aria-label="Select City">
        <option value="all">{t('all_cities', lang)}</option>
        {cities.map(city => <option key={city} value={city}>{city}</option>)}
      </select>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
      <input type="text" placeholder="Search by title, address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none" />
      <button className="bg-indigo-600 text-white p-2 rounded-full m-1 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800" aria-label="Search">
        <SearchIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {!isMobileSearchOpen && (
            <>
              <a href="/" className="flex items-center cursor-pointer no-underline gap-2 flex-shrink-0">
                <img src="https://iili.io/qNyNLKJ.md.png" alt="Sajilo Rent logo" className="h-9 w-9 rounded-full object-cover" />
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                  Sajilo Rent
                </h1>
              </a>
              
              <div className="hidden lg:flex flex-grow items-center justify-center px-8">
                <div className="w-full max-w-2xl">
                  {SearchBarComponent}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="lg:hidden p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Open Search"
                >
                  <SearchIcon />
                </button>
                {user && (
                  <button
                    onClick={onMessagesClick}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                    aria-label="Open Messages"
                  >
                    <MessageIcon />
                  </button>
                )}
                <button
                  onClick={toggleLang}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle Language"
                >
                  <GlobeIcon />
                </button>
                
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle Theme"
                >
                  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>

                {/* More Options Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="More options"
                    >
                        <EllipsisVerticalIcon />
                    </button>
                    {isMoreMenuOpen && (
                        <div 
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20"
                            onMouseLeave={() => setIsMoreMenuOpen(false)}
                        >
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">About Us</a>
                            <a href="mailto:troomzone@gmail.com" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Contact Us</a>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <button onClick={(e) => { e.preventDefault(); onOpenLegalModal('terms'); setIsMoreMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Terms of Service</button>
                            <button onClick={(e) => { e.preventDefault(); onOpenLegalModal('privacy'); setIsMoreMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Privacy Policy</button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <div className="px-4 py-2">
                                <div className="flex space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-indigo-500" aria-label="Facebook"><FacebookIcon className="h-5 w-5"/></a>
                                    <a href="#" className="text-gray-400 hover:text-indigo-500" aria-label="Twitter"><TwitterIcon className="h-5 w-5"/></a>
                                    <a href="https://www.instagram.com/troomzone/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500" aria-label="Instagram"><InstagramIcon className="h-5 w-5"/></a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:block border-l border-gray-200 dark:border-gray-700 h-6 mx-2"></div>

                 {isAdmin && (
                     <button
                        onClick={onListRoomClick}
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" />
                        {t('list_a_room', lang)}
                    </button>
                )}

                {isAdmin && (
                   <button
                    onClick={onAdminPanelClick}
                    className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Admin Panel
                  </button>
                )}
                
                {renderAuthControl()}
              </div>
            </>
          )}

          {isMobileSearchOpen && (
            <div className="lg:hidden w-full flex items-center">
              <div className="flex-grow">
                {SearchBarComponent}
              </div>
              <button onClick={() => setIsMobileSearchOpen(false)} className="ml-2 flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close Search">
                <XIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;