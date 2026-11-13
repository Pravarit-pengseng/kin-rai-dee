import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Platform } from 'react-native';

export interface UseKeyboardScrollOptions {
  /** Extra offset in pixels above the focused element */
  extraOffset?: number;
  /** Custom bottom padding to maintain when keyboard is hidden */
  defaultBottomPadding?: number;
}

export function useKeyboardScroll(options?: UseKeyboardScrollOptions) {
  const defaultPadding = options?.defaultBottomPadding ?? 20;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const handleShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 280;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
    };

    const handleHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    // Listen to both willShow/didShow and willHide/didHide to support all iOS & Android versions
    const willShowSub = Keyboard.addListener('keyboardWillShow', handleShow);
    const didShowSub = Keyboard.addListener('keyboardDidShow', handleShow);
    const willHideSub = Keyboard.addListener('keyboardWillHide', handleHide);
    const didHideSub = Keyboard.addListener('keyboardDidHide', handleHide);

    return () => {
      willShowSub.remove();
      didShowSub.remove();
      willHideSub.remove();
      didHideSub.remove();
    };
  }, []);

  /**
   * Scroll to specific Y offset
   */
  const scrollTo = useCallback((y: number, animated = true) => {
    scrollRef.current?.scrollTo?.({ y, animated });
  }, []);

  /**
   * Scroll to specific Y offset with slight delay to allow keyboard layout animation
   */
  const scrollIntoView = useCallback((y: number, delayMs = 120) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo?.({ y, animated: true });
    }, delayMs);
  }, []);

  /**
   * Scroll to bottom to reveal submit buttons or lower inputs
   */
  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated });
    }, 120);
  }, []);

  /**
   * Dynamic bottom padding:
   * - When keyboard is open:
   *   - Android: Keyboard occupies screen height; add keyboardHeight + defaultPadding so user can freely scroll past keyboard.
   *   - iOS: KeyboardAvoidingView elevates the view; add defaultPadding + 40 so bottom buttons don't butt against keyboard edge.
   * - When keyboard is closed: Returns exact defaultPadding with ZERO abnormal whitespace or shifts.
   */
  const contentBottomPadding = isKeyboardVisible
    ? Platform.OS === 'android'
      ? keyboardHeight + defaultPadding
      : defaultPadding + 40
    : defaultPadding;

  return {
    scrollRef,
    keyboardHeight,
    isKeyboardVisible,
    contentBottomPadding,
    scrollTo,
    scrollIntoView,
    scrollToEnd,
  };
}
