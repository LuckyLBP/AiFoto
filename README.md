# AiFoto

AiFoto is a mobile application for creating professional-looking vehicle photography with automated background removal and replacement features. The app is designed to help car dealerships and individual sellers create high-quality images of vehicles by guiding users through a structured photography process and enhancing images automatically.

## Features

### Core Functionality

- **Guided Car Photography**: Step-by-step interface for capturing vehicles from multiple required angles
- **AI-Powered Background Removal**: Automatically removes backgrounds from vehicle photos
- **Background Replacement**: Add professional studio and other backgrounds to vehicle photos
- **Photo Management**: Organize and manage vehicle photo sessions
- **Image Gallery**: Store and browse processed images

### Photo Session Workflow

1. **Vehicle Information**: Enter make, model, and year of the vehicle
2. **Guided Photography**: The app guides you through taking photos of the car from specific angles
   - Exterior angles (Front, Side, Rear, etc.)
   - Interior angles (Dashboard, etc.)
   - Visual guide overlays to help with optimal positioning
3. **Background Editing**: Process images to:
   - Remove original backgrounds
   - Place vehicle photos on professional backgrounds
4. **Session Completion**: Save and organize final images in the gallery

### Technical Features

- **Dark/Light Mode**: Supports system and manual theme switching
- **Local Storage**: Saves images and settings to device storage
- **Responsive Design**: Works on various screen sizes and orientations
- **Camera Integration**: Direct access to device camera with custom UI
- **Image Processing**: Background removal with preview capability

## Architecture

AiFoto is built using:

- **React Native**: Core framework for building the mobile app
- **Expo**: Development platform for React Native
- **Expo Router**: For navigation and routing
- **AsyncStorage**: For local data persistence
- **Expo Camera**: For the camera functionality
- **React Native ViewShot**: For capturing composed images

### Project Structure

- `/app`: Contains the main screens and navigation structure
  - `/(tabs)`: Main tab navigation (Home, Gallery, Profile)
  - `/car`: Car photography flow screens
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks for state management and business logic
- `/theme`: Theming and styling utilities
- `/types`: TypeScript type definitions
- `/utils`: Helper functions and utilities
- `/assets`: Static assets including background images and car outlines

### Key Components

- **CarCamera**: Custom camera interface with angle overlays
- **ImageEditor**: Background selection and image compositing tool
- **CarSession**: Manages the state of a vehicle photography session
- **BackgroundCompositor**: Combines vehicle images with backgrounds

## Getting Started

### Prerequisites

- Node.js (14.0 or later)
- npm or Yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. Clone the repository

   ```
   git clone [https://github.com/LuckyLBP/AiFoto.git]
   cd AiFoto
   ```

2. Install dependencies

   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```
   npx expo start
   ```

### Development

- Use `npx expo start --ios` or `npx expo start --android` to run on specific platforms
- Press `i` for iOS simulator or `a` for Android emulator when Expo is running

## Usage

1. **Home Screen**: Choose to start a new car photo session
2. **New Session**: Enter car details (make, model, year)
3. **Angles Screen**: Take photos of the car from different required angles
4. **Editing Screen**: Add backgrounds to the exterior photos
5. **Completion**: Save the session to your gallery
