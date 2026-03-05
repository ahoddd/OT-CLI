export default {
  expo: {
    name: "OrbTap",
    slug: "orbtap",
    owner: "amoustafa",
    version: "1.0.0",
    orientation: "portrait",
    // App icon: use main OrbTap logo (dark theme) for all users. Generate from assets/images/logo-source.png via npm run generate-icons.
    icon: "./assets/images/icon.png",
    scheme: "orbtap",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    experiments: { typedRoutes: true },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.orbtap.app",
      infoPlist: {
        NSCameraUsageDescription: "OrbTap needs camera access to scan partner QR codes.",
        NSPhotoLibraryUsageDescription: "Allow access to upload your profile avatar.",
        NSLocationWhenInUseUsageDescription: "OrbTap needs your location to find nearby drops.",
        NSFaceIDUsageDescription: "Use Face ID to sign in to OrbTap quickly and securely.",
        NSHumanReadableCopyright: "© 2026 OrbTap. All rights reserved.",
        ITSAppUsesNonExemptEncryption: false,
      },
      associatedDomains: ["applinks:orbtap.com"],
    },
    android: {
      package: "com.orbtap.app",
      adaptiveIcon: {
        // Same dark logo as icon so app icon is consistent for all users.
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#020617"
      },
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "https", host: "orbtap.com", pathPrefix: "/invite" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      name: "OrbTap",
      shortName: "OrbTap",
      themeColor: "#020617",
      description: "Discover real places, earn points, redeem perks. Proof-backed and local.",
      meta: {
        viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        "theme-color": "#020617"
      },
      display: "standalone",
      startUrl: "/"
    },
    plugins: [
      "@react-native-community/datetimepicker",
      "./plugins/withRNFBPodfileFix",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#020617"
        }
      ],
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN || process.env.MAPBOX_DOWNLOAD_TOKEN || '',
          "RNMapboxMapsVersion": "11.15.2"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "2.1.20",
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24
          },
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1",
            "forceStaticLinking": ["RNFBApp", "RNFBAuth"]
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "fdab8c65-d83a-4f19-8784-aa329426be28"
      },
      // Mapbox public token — also set EXPO_PUBLIC_MAPBOX_TOKEN in .env / EAS secrets so the map loads
      mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',
      // Store listing: set EXPO_PUBLIC_APP_LINK in .env (e.g. https://orbtap.com)
      privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || (process.env.EXPO_PUBLIC_APP_LINK || 'https://orbtap.com') + '/legal/privacy',
      supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL || (process.env.EXPO_PUBLIC_APP_LINK || 'https://orbtap.com') + '/support',
    }
  }
};
