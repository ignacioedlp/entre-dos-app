import * as Notifications from 'expo-notifications';

const PROJECT_ID = '71438918-3d0f-4833-b171-672af43d53d0';

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    return token.data;
  } catch {
    return null;
  }
}
