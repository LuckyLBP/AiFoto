export interface CarAngle {
  id: string;
  name: string;
  description: string;
  isInterior: boolean;
  outlineImage?: any;
  requiredForListing: boolean;
}

export interface CarPhoto {
  id: string;
  uri: string;
  angleId: string;
  processed: boolean;
  backgroundRemoved: boolean;
  backgroundAdded: boolean;
  finalImageUri?: string;
  createdAt: number;
}

export interface CarSession {
  id: string;
  dealershipId: string;
  userId: string;
  carMake: string;
  carModel: string;
  year: number;
  photos: CarPhoto[];
  createdAt: number;
  updatedAt: number;
  completed: boolean;
}

export interface EditableImage {
  uri: string;
  position: {
    x: number;
    y: number;
  };
  scale: number;
  rotation: number;
}

export interface Background {
  id: string;
  name: string;
  uri: any;
  thumbnail?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  dealershipId: string;
}

export interface GalleryImage {
  id: string;
  uri: string;
  createdAt: number;
  category?: string;
  metadata?: {
    carMake?: string;
    carModel?: string;
    year?: number;
    angleId?: string;
    sessionId?: string;
    angleName?: string;
  };
}
