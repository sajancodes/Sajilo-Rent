// Fix: Replaced placeholder content with a simple i18n utility.
export type Language = 'en' | 'ne' | 'hi';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    app_title: 'Sajilo Rent',
    search_placeholder: 'Search for rooms in...',
    list_a_room: 'List a Room',
    login: 'Log In',
    logout: 'Log Out',
    
    // Filters
    filter_options: 'Filter Options',
    reset: 'Reset',
    city: 'City',
    all_cities: 'All Cities',
    price_range_npr: 'Price Range (NPR)',
    price_range_inr: 'Price Range (INR)',
    room_type: 'Room Type',
    amenities: 'Amenities',
    suitable_for: 'Suitable For',

    // Main content
    no_results_title: 'No Rooms Found',
    no_results_desc: 'Try adjusting your filters or search terms.',
    loading: 'Finding rooms for you...',

  },
  ne: {
    // Header
    app_title: 'सजिलो रेन्ट',
    search_placeholder: 'कोठाहरू खोज्नुहोस्...',
    list_a_room: 'कोठा सूची गर्नुहोस्',
    login: 'लग - इन',
    logout: 'लग - आउट',

    // Filters
    filter_options: 'फिल्टर विकल्पहरू',
    reset: 'रिसेट',
    city: 'शहर',
    all_cities: 'सबै शहरहरू',
    price_range_npr: 'मूल्य दायरा (NPR)',
    price_range_inr: 'मूल्य दायरा (INR)',
    room_type: 'कोठाको प्रकार',
    amenities: 'सुविधाहरू',
    suitable_for: 'यसका लागि उपयुक्त',

    // Main content
    no_results_title: 'कुनै कोठा भेटिएन',
    no_results_desc: 'आफ्नो फिल्टर वा खोज शब्दहरू समायोजन गर्ने प्रयास गर्नुहोस्।',
    loading: 'तपाईंको लागि कोठा खोज्दै...',
  },
  hi: {
    // Header
    app_title: 'सजीलो रेंट',
    search_placeholder: 'कमरों के लिए खोजें...',
    list_a_room: 'कमरा किराए पर दें',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',

    // Filters
    filter_options: 'फ़िल्टर विकल्प',
    reset: 'रीसेट',
    city: 'शहर',
    all_cities: 'सभी शहर',
    price_range_npr: 'मूल्य सीमा (NPR)',
    price_range_inr: 'मूल्य सीमा (INR)',
    room_type: 'कमरे का प्रकार',
    amenities: 'सुविधाएं',
    suitable_for: 'किसके लिए उपयुक्त',

    // Main content
    no_results_title: 'कोई कमरा नहीं मिला',
    no_results_desc: 'अपने फ़िल्टर या खोज शब्दों को समायोजित करने का प्रयास करें।',
    loading: 'आपके लिए कमरे ढूंढ रहे हैं...',
  },
};

export const t = (key: string, lang: Language): string => {
  return translations[lang][key] || key;
};