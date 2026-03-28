// Fix: Replaced placeholder content with actual type definitions.
export type Country = 'NEPAL' | 'INDIA';

export enum RoomType {
  SINGLE_ROOM = 'SINGLE_ROOM',
  SHARED = 'SHARED',
  FLAT = 'FLAT',
  ROOM_KITCHEN = 'ROOM_KITCHEN',
  APARTMENT = 'APARTMENT',
  HOTEL = 'HOTEL',
  HOSTEL = 'HOSTEL',
}

export enum Amenity {
  WIFI = 'WIFI',
  PARKING = 'PARKING',
  BATHROOM = 'BATHROOM', // Attached Bathroom
  KITCHEN = 'KITCHEN', // Kitchen Access
  AC = 'AC',
  FURNISHED = 'FURNISHED',
}

export enum SuitableFor {
  STUDENTS = 'STUDENTS',
  FAMILY = 'FAMILY',
  PROFESSIONALS = 'PROFESSIONALS',
}

export interface RoomListing {
  id: string;
  country: Country;
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  roomType: RoomType;
  amenities: Amenity[];
  suitableFor: SuitableFor[];
  imageUrls: string[];
  rating: number;
  reviews: number;
  isVerified: boolean;
  isAvailable: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  contact: {
    name: string;
    phone: string;
  };
  listedDate: any; // Using 'any' for Firestore Timestamp compatibility
  availableFrom?: any; // Using 'any' for Firestore Timestamp compatibility
  listerId?: string; // UID of the user who listed the room
}

export interface Filters {
  country: Country;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  roomTypes: RoomType[];
  amenities: Amenity[];
  suitableFor: SuitableFor[];
  searchTerm: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: 'user' | 'admin';
  createdAt?: any; // Firestore Timestamp
}

export interface ChatParticipantInfo {
  name: string;
  photoURL: string;
}

export interface Chat {
  id: string;
  listingId: string;
  listingTitle: string;
  participantIds: string[];
  participantInfo: {
    [uid: string]: ChatParticipantInfo;
  };
  lastMessage: string;
  lastMessageTimestamp: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  unreadCount?: {
    [uid: string]: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: any; // Firestore Timestamp
  isRead?: boolean;
}