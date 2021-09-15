import React from 'react'
import {
  Platform,
  Linking,
  Alert,
} from 'react-native'
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";

export const requestCameraPermissions = (title: string, onSuccess: () => void) => {
  request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
    .then((result) => {
      switch (result) {
        case RESULTS.GRANTED:
          onSuccess()
          break;
        default:
          Alert.alert(
            title,
            null,
            [
              {
                text: 'Settings',
                onPress: async () => {
                  await Linking.openSettings()
                },
              },
              {
                text: 'Cancel',
              },
            ],
            { cancelable: false }
          )
          break;
      }
    });
}
