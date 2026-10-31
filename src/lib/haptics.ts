import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

export const tap = () => enabled && Haptics.selectionAsync().catch(() => {});
export const celebrate = () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
