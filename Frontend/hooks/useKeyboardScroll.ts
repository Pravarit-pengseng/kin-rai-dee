import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Keyboard,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from 'react-native';

export interface UseKeyboardScrollOptions {
  /** Extra offset in pixels above the keyboard for the focused element (default 24) */
  extraOffset?: number;
  /** Custom bottom padding to maintain when keyboard is hidden (default 12) */
  defaultBottomPadding?: number;
  /** Automatically scroll back to top when keyboard dismisses (default true) */
  resetOnHide?: boolean;
}

export function useKeyboardScroll(options?: UseKeyboardScrollOptions) {
  const defaultPadding = options?.defaultBottomPadding ?? 12;
  const extraOffset = options?.extraOffset ?? 24;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollRef = useRef<any>(null);
  const currentScrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const isKeyboardVisibleRef = useRef(false);
  const activeInputRef = useRef<any>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Tracks current scroll offset in real-time
   */
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentScrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  /**
   * Direct scroll to Y offset
   */
  const scrollTo = useCallback((y: number, animated = true) => {
    scrollRef.current?.scrollTo?.({ y, animated });
  }, []);

  /**
   * Scroll to bottom of ScrollView
   */
  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated });
    }, 100);
  }, []);

  /**
   * Intelligently scroll the focused input into view:
   * - If the input is already comfortably visible, does nothing (avoids annoying jumps while typing).
   * - If the input would be covered by the keyboard or too close to it, smoothly scrolls just enough
   *   so the input is fully visible above the keyboard with extra breathing room.
   */
  const scrollToFocusedInput = useCallback(
    (target: any, customOffset?: number) => {
      const node = target?.current || target;
      if (!node) return;

      activeInputRef.current = node;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const offset = customOffset ?? extraOffset;

      const performScroll = () => {
        if (!node?.measureInWindow || !scrollRef.current) return;

        node.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (y === undefined || height === undefined) return;

          const windowHeight = Dimensions.get('window').height;
          const isAndroid = Platform.OS === 'android';
          const kbHeight = keyboardHeightRef.current;

          // Compute visible height above keyboard
          const visibleHeight = isAndroid
            ? (windowHeight < 600 && kbHeight > 0 ? windowHeight : Math.max(windowHeight - kbHeight, 200))
            : (isKeyboardVisibleRef.current ? windowHeight - kbHeight : windowHeight);

          const inputBottom = y + height;
          const targetBottom = visibleHeight - offset;

          // If input bottom is obscured by the keyboard:
          if (inputBottom > targetBottom) {
            const overlap = inputBottom - targetBottom;
            const newY = Math.max(0, currentScrollYRef.current + overlap);
            scrollRef.current?.scrollTo?.({ y: newY, animated: true });
          } else if (y < 60) {
            // If input is scrolled too high under top header:
            const overlapTop = 60 - y;
            const newY = Math.max(0, currentScrollYRef.current - overlapTop);
            scrollRef.current?.scrollTo?.({ y: newY, animated: true });
          }
          // If already comfortably visible between top and keyboard, DO NOT scroll!
        });
      };

      // Delay to let keyboard animate
      const delay = isKeyboardVisibleRef.current ? 50 : (Platform.OS === 'ios' ? 220 : 120);
      setTimeout(performScroll, delay);
    },
    [extraOffset]
  );

  /**
   * Legacy compatibility helper
   */
  const scrollIntoView = useCallback(
    (target: any, delayMs = 120) => {
      if (typeof target === 'number') {
        setTimeout(() => {
          scrollRef.current?.scrollTo?.({ y: target, animated: true });
        }, delayMs);
      } else {
        scrollToFocusedInput(target);
      }
    },
    [scrollToFocusedInput]
  );

  useEffect(() => {
    const handleShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 280;
      setKeyboardHeight(height);
      keyboardHeightRef.current = height;
      setIsKeyboardVisible(true);
      isKeyboardVisibleRef.current = true;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      // If an input was focused while keyboard was opening, verify its position
      if (activeInputRef.current) {
        setTimeout(() => {
          if (activeInputRef.current) {
            scrollToFocusedInput(activeInputRef.current);
          }
        }, Platform.OS === 'ios' ? 80 : 60);
      }
    };

    const handleHide = () => {
      setKeyboardHeight(0);
      keyboardHeightRef.current = 0;
      setIsKeyboardVisible(false);
      isKeyboardVisibleRef.current = false;
      activeInputRef.current = null;

      if (options?.resetOnHide) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          if (!isKeyboardVisibleRef.current) {
            scrollRef.current?.scrollTo?.({ y: 0, animated: true });
          }
        }, 120);
      }
    };

    const willShowSub = Keyboard.addListener('keyboardWillShow', handleShow);
    const didShowSub = Keyboard.addListener('keyboardDidShow', handleShow);
    const willHideSub = Keyboard.addListener('keyboardWillHide', handleHide);
    const didHideSub = Keyboard.addListener('keyboardDidHide', handleHide);

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      willShowSub.remove();
      didShowSub.remove();
      willHideSub.remove();
      didHideSub.remove();
    };
  }, [options?.resetOnHide, scrollToFocusedInput]);

  /**
   * Dynamic bottom padding:
   * Provides appropriate clearance when keyboard is open so the user can freely scroll
   * the bottom-most input or button above the keyboard, without double-padding on Android.
   */
  const contentBottomPadding = isKeyboardVisible
    ? (Platform.OS === 'android' ? 24 : 32)
    : defaultPadding;

  return {
    scrollRef,
    keyboardHeight,
    isKeyboardVisible,
    contentBottomPadding,
    handleScroll,
    scrollTo,
    scrollIntoView,
    scrollToEnd,
    scrollToFocusedInput,
  };
}
