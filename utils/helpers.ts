// Helper functions for the application

// Generate a unique ID
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Format date to a readable string
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('sv-SE') + ' ' + date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
};

// Check if all required angles have been photographed
export const hasAllRequiredAngles = (photos: any[], requiredAngles: string[]): boolean => {
  const photographedAngles = new Set(photos.map(photo => photo.angleId));
  return requiredAngles.every(angleId => photographedAngles.has(angleId));
};

// Get a friendly name for the car
export const getCarFullName = (make: string, model: string, year: number): string => {
  return `${make} ${model} (${year})`;
};
