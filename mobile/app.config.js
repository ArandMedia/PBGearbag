export default {
  expo: {
    name: "PBGearbag",
    slug: "pbgearbag",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pbg.social",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to capture photos for posts and marketplace listings.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to select images for posts and marketplace listings.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to find nearby fields, events, and players."
      }
    },
    android: {
      package: "com.pbg.social",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      build: {
        babel: {
          include: [
            "@react-navigation/web"
          ]
        }
      }
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them with the community."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow the app to access your camera to capture photos and videos."
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow the app to use your location to find nearby events and fields."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "pbg-social-prod"
      }
    }
  }
}
