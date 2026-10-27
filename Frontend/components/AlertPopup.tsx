import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/constants/typography';

export type AlertPopupButton = {
  text: string;
  /** 'confirm' = styled red (primary), 'cancel' = styled grey */
  style?: 'confirm' | 'cancel';
  onPress?: () => void;
};

export type AlertPopupProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertPopupButton[];
  onRequestClose?: () => void;
};

/**
 * Custom alert popup — replaces React Native Alert.alert().
 * Styled to match LogoutPopup: white card, rounded, bevel buttons.
 */
export default function AlertPopup({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
}: AlertPopupProps) {
  const resolvedButtons: AlertPopupButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'ตกลง', style: 'confirm' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttonRow, resolvedButtons.length === 1 && styles.singleButtonRow]}>
            {resolvedButtons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? styles.cancelButton : styles.confirmButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={btn.onPress ?? onRequestClose}
                >
                  <Text style={[styles.buttonText, isCancel ? styles.cancelText : styles.confirmText]}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Hook for managing AlertPopup state conveniently. */
export function useAlertPopup() {
  const [state, setState] = React.useState<AlertPopupProps>({
    visible: false,
    title: '',
  });

  const show = React.useCallback(
    (title: string, message?: string, buttons?: AlertPopupButton[]) => {
      setState({ visible: true, title, message, buttons });
    },
    []
  );

  const hide = React.useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return { alertProps: state, show, hide };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Typography.bold,
    fontWeight: '700',
    color: '#241917',
    marginBottom: 10,
    lineHeight: 26,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Typography.regular,
    color: '#57423E',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  singleButtonRow: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 3,
  },
  cancelButton: {
    backgroundColor: '#6B728033',
    borderColor: '#24191733',
    borderBottomColor: '#24191733',
  },
  confirmButton: {
    backgroundColor: '#FF7A6633',
    borderColor: '#72120933',
    borderBottomColor: '#72120933',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelText: {
    color: '#57423E',
  },
  confirmText: {
    color: '#9B2C24',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
