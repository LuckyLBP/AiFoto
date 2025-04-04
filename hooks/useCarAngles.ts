import { useState } from 'react';
import { CarAngle } from '../types';

// Standardvinklar för bil som vi kommer att använda i appen
const DEFAULT_CAR_ANGLES: CarAngle[] = [
  {
    id: 'front',
    name: 'Fronten',
    description: 'Bilens framsida',
    isInterior: false,
    // Obs! Du behöver skapa och lägga till dessa konturer i assets-mappen
    outlineImage: require('../assets/outlines/car-front.png'),
    requiredForListing: true,
  },
  {
    id: 'front-side-driver',
    name: 'Front/Sida (förarsidan)',
    description: 'Diagonal vy från framsida och förarsidan',
    isInterior: false,
    outlineImage: require('../assets/outlines/car-side-driver.png'),
    requiredForListing: true,
  },
  {
    id: 'rear-side-driver',
    name: 'Bak/Sida (förarsidan)',
    description: 'Diagonal vy från baksida och förarsidan',
    isInterior: false,
    outlineImage: require('../assets/outlines/car-rear-angle.png'),
    requiredForListing: false,
  },
  {
    id: 'rear',
    name: 'Baklucka',
    description: 'Bilens baksida',
    isInterior: false,
    outlineImage: require('../assets/outlines/car-rear.png'),
    requiredForListing: true,
  },
  {
    id: 'rear-side-passenger',
    name: 'Bak/Sida (passagerarsidan)',
    description: 'Diagonal vy från baksida och passagerarsidan',
    isInterior: false,
    outlineImage: require('../assets/outlines/car-rear-angle.png'),
    requiredForListing: false,
  },
  {
    id: 'side-passenger',
    name: 'Sida (passagerarsidan)',
    description: 'Rak vy från passagerarsidan',
    isInterior: false,
    outlineImage: require('../assets/outlines/car-side.png'),
    requiredForListing: true,
  },
  {
    id: 'dashboard',
    name: 'Instrumentpanel',
    description: 'Instrumentpanel från förarsätet',
    isInterior: true,
    outlineImage: require('../assets/outlines/car-interior.png'),
    requiredForListing: true,
  },
];

export const useCarAngles = () => {
  const [carAngles] = useState<CarAngle[]>(DEFAULT_CAR_ANGLES);
  const [loading] = useState<boolean>(false);
  
  const getExteriorAngles = () => {
    return carAngles.filter(angle => !angle.isInterior);
  };
  
  const getInteriorAngles = () => {
    return carAngles.filter(angle => angle.isInterior);
  };
  
  const getRequiredAngles = () => {
    return carAngles.filter(angle => angle.requiredForListing);
  };
  
  return {
    carAngles,
    loading,
    getExteriorAngles,
    getInteriorAngles,
    getRequiredAngles,
  };
};
