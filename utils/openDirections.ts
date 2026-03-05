/**
 * Directions — prompt user to choose Apple Maps, Google Maps, or Waze,
 * then open the chosen app with the destination or the App Store if not installed.
 */

import { Alert, Linking, Platform } from 'react-native';

const APP_STORE_GOOGLE_MAPS = 'https://apps.apple.com/app/google-maps/id585027354';
const APP_STORE_WAZE = 'https://apps.apple.com/app/waze-navigation-live-traffic/id323229106';
const PLAY_STORE_GOOGLE_MAPS = 'https://play.google.com/store/apps/details?id=com.google.android.apps.maps';
const PLAY_STORE_WAZE = 'https://play.google.com/store/apps/details?id=com.waze';

function appleMapsUrl(lat: number, lng: number): string {
  return Platform.OS === 'ios'
    ? `maps://?daddr=${lat},${lng}&dirflg=d`
    : `https://maps.apple.com/?daddr=${lat},${lng}`;
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function googleMapsScheme(lat: number, lng: number): string {
  return `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
}

function wazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

function wazeScheme(lat: number, lng: number): string {
  return `waze://?ll=${lat},${lng}&navigate=yes`;
}

async function openUrlOrStore(url: string, appStoreUrl: string): Promise<void> {
  const can = await Linking.canOpenURL(url).catch(() => false);
  if (can) {
    await Linking.openURL(url).catch(() => Linking.openURL(appStoreUrl).catch(() => {}));
  } else {
    const store = Platform.OS === 'ios' ? appStoreUrl : (appStoreUrl.includes('apple.com') ? (url.includes('google') ? PLAY_STORE_GOOGLE_MAPS : PLAY_STORE_WAZE) : appStoreUrl);
    await Linking.openURL(store).catch(() => {});
  }
}

export function promptAndOpenDirections(lat: number, lng: number): void {
  Alert.alert('Get Directions', 'Open with', [
    { text: 'Apple Maps', onPress: () => Linking.openURL(appleMapsUrl(lat, lng)).catch(() => {}) },
    {
      text: 'Google Maps',
      onPress: () => {
        if (Platform.OS === 'ios') {
          openUrlOrStore(googleMapsScheme(lat, lng), APP_STORE_GOOGLE_MAPS);
        } else {
          Linking.openURL(googleMapsUrl(lat, lng)).catch(() => Linking.openURL(PLAY_STORE_GOOGLE_MAPS).catch(() => {}));
        }
      },
    },
    {
      text: 'Waze',
      onPress: () => openUrlOrStore(wazeScheme(lat, lng), Platform.OS === 'ios' ? APP_STORE_WAZE : PLAY_STORE_WAZE),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
