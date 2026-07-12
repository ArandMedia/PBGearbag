import { Alert as NativeAlert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// react-native-web ships no Alert implementation, so Alert.alert() is a
// silent no-op in the browser — every error/confirmation dialog in the app
// would render nothing. This shim falls back to window.alert/confirm on web.
function webAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const text = [title, message].filter(Boolean).join('\n\n');
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const confirmButton = buttons.find((b) => b !== cancelButton) || buttons[buttons.length - 1];
  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS === 'web') {
      webAlert(title, message, buttons);
    } else {
      NativeAlert.alert(title, message, buttons as any);
    }
  },
};
