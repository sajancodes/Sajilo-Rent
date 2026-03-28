Sajilo Rent
Sajilo Rent is a modern, high-performance web application designed to simplify the process of finding and managing room rentals in Nepal and India. Built with a focus on speed, user experience, and local needs, it provides a centralized platform for discovering flats, apartments, and individual rooms.
🚀 Key Features
1. Advanced Search & Filtering
Location-Based: Filter listings by country (Nepal/India) and specific cities.
Granular Filters: Narrow down results by price range, room type (Single, Double, Flat, Apartment), amenities (WiFi, Parking, Water, etc.), and suitability (Students, Families, Professionals).
Real-time Search: Instant search by title, address, or description.
2. Interactive Map Integration
Visual Discovery: View room locations on an interactive map powered by Leaflet and Esri.
Nearby Search: Automatically detects user location (with permission) to show rooms within a 10km radius.
3. Admin-Centric Listing Management
Restricted Listing: To ensure quality and prevent spam, the ability to list new rooms is restricted to the platform administrator.
Admin Panel: A dedicated dashboard for the admin to manage, edit, and delete listings.
4. User Experience & Personalization
Multilingual Support: Fully localized in English, Nepali, and Hindi.
Dark Mode: Seamless transition between light and dark themes based on user preference or system settings.
Responsive Design: A mobile-first approach ensuring a smooth experience across desktops, tablets, and smartphones.
5. Robust Security & SEO
Authentication: Secure Google Login integration via Firebase Authentication.
SEO Optimized: Dynamic page titles, meta descriptions, and structured data (JSON-LD) for every listing to improve search engine visibility.
Legal Compliance: Integrated Terms of Service and Privacy Policy modals.
🛠️ Tech Stack
Frontend: React 19, TypeScript, Tailwind CSS
Backend & Database: Firebase (Firestore, Authentication)
Maps: Leaflet, Esri Leaflet
Icons: Lucide React
Build Tool: Vite
Animations: Tailwind CSS transitions
📂 Project Structure
/src/App.tsx: Main application logic and routing.
/src/components/: Reusable UI components (Header, Footer, Modals, Cards).
/src/firebase/: Firebase configuration and initialization.
/src/utils/i18n.ts: Internationalization utility and translations.
/src/constants.ts: Shared constants like city lists and room types.
/src/types.ts: Global TypeScript interfaces and types.
⚙️ Setup & Installation
Clone the repository:
code
Bash
git clone <repository-url>
Install dependencies:
code
Bash
npm install
Configure Environment Variables:
Create a .env file and add your Firebase and Gemini API keys:
code
Env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
...
GEMINI_API_KEY=your_gemini_key
Run the development server:
code
Bash
npm run dev
Build for production:
code
Bash
npm run build
🛡️ Administrative Configuration
To grant admin privileges to a specific user, update the ADMIN_UID constant in App.tsx with the user's Firebase UID:
code
TypeScript
const ADMIN_UID = 'UrH1D9UX7YSjt9KyOc7fXDwA8jl1';
