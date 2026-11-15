import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  UIManager,
  findNodeHandle,
} from 'react-native';

type UseKeyboardScrollOptions = {
  extraScrollHeight?: number;
  extraOffset?: number;
  defaultBottomPadding?: number;
  resetOnHide?: boolean;
};

type ScrollTarget =
  | React.RefObject<any>
  | number
  | 'end'
  | null
  | undefined;

export function useKeyboardScroll(options: UseKeyboardScrollOptions = {}) {
  const {
    extraScrollHeight,
    extraOffset,
    defaultBottomPadding = 40,
    resetOnHide = false,
  } = options;
  const resolvedExtraScrollHeight = extraScrollHeight ?? extraOffset ?? 120;

  const scrollViewRef = useRef<any>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [layoutShrinkAmount, setLayoutShrinkAmount] = useState(0);

  const currentScrollYRef = useRef(0);
  const activeTargetRef = useRef<ScrollTarget>(null);
  const activeCustomOffsetRef = useRef<number | undefined>(undefined);
  const keyboardHeightRef = useRef(0);
  const isKeyboardVisibleRef = useRef(false);
  const scrollLayoutHeightRef = useRef(0);
  const maxScrollLayoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const AppliedExtraPaddingRef = useRef(0);

  const executeScrollTarget = useCallback(
    (target: ScrollTarget, customOffset?: number) => {
      if (target === null || target === undefined || !scrollViewRef.current) return;

      const offset = customOffset ?? resolvedExtraScrollHeight;

      if (target === 'end') {
        scrollViewRef.current.scrollToEnd({ animated: true });
        return;
      }

      if (typeof target === 'number') {
        scrollViewRef.current.scrollTo({ y: Math.max(0, target), animated: true });
        return;
      }

      const inputElement = target?.current ? target.current : target;
      if (!inputElement) return;

      const inputNode = findNodeHandle(inputElement);
      const scrollNode = findNodeHandle(scrollViewRef.current);

      if (inputNode && scrollNode) {
        UIManager.measureLayout(
          inputNode,
          scrollNode,
          () => {},
          (_left, top, _width, height) => {
            const windowHeight = Dimensions.get('window').height;
            const kbHeight = keyboardHeightRef.current;

            UIManager.measureInWindow(
              scrollNode,
              (_scrollX, scrollWindowY, _scrollW, scrollWindowH) => {
                const effectiveScrollTopY =
                  typeof scrollWindowY === 'number' && scrollWindowY >= 0 ? scrollWindowY : 0;
                const effectiveScrollHeight =
                  typeof scrollWindowH === 'number' && scrollWindowH > 0
                    ? scrollWindowH
                    : scrollLayoutHeightRef.current > 0
                      ? scrollLayoutHeightRef.current
                      : windowHeight - effectiveScrollTopY;

                const scrollBottomInWindow = effectiveScrollTopY + effectiveScrollHeight;
                const keyboardTopInWindow =
                  kbHeight > 0 ? windowHeight - kbHeight : windowHeight * 0.58;

                // Visible bottom inside ScrollView coordinate space
                const visibleViewportHeight = Math.max(
                  140,
                  Math.min(scrollBottomInWindow, keyboardTopInWindow) - effectiveScrollTopY
                );

                const inputTopInViewport = top - currentScrollYRef.current;
                const inputBottomInViewport = inputTopInViewport + height;
                const safeTopMargin = 20;
                const safeBottomLimit = visibleViewportHeight - Math.max(offset, 72);

                if (inputBottomInViewport > safeBottomLimit) {
                  const delta = inputBottomInViewport - safeBottomLimit;
                  const targetY = Math.max(0, currentScrollYRef.current + delta);
                  scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                } else if (inputTopInViewport < safeTopMargin) {
                  const targetY = Math.max(0, top - safeTopMargin);
                  scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                }
              }
            );
          }
        );
      }
    },
    [resolvedExtraScrollHeight]
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const clearTimers = () => {
      while (timers.length > 0) {
        const t = timers.pop();
        if (t) clearTimeout(t);
      }
    };

    const handleShow = (e: any) => {
      const height = e?.endCoordinates?.height || 300;
      isKeyboardVisibleRef.current = true;
      keyboardHeightRef.current = height;
      setKeyboardVisible(true);
      setKeyboardHeight(height);

      clearTimers();
      if (activeTargetRef.current !== null && activeTargetRef.current !== undefined) {
        timers.push(
          setTimeout(() => {
            executeScrollTarget(activeTargetRef.current, activeCustomOffsetRef.current);
          }, 80)
        );
        timers.push(
          setTimeout(() => {
            executeScrollTarget(activeTargetRef.current, activeCustomOffsetRef.current);
          }, 240)
        );
      }
    };

    const handleHide = () => {
      clearTimers();
      isKeyboardVisibleRef.current = false;
      keyboardHeightRef.current = 0;
      activeTargetRef.current = null;
      activeCustomOffsetRef.current = undefined;
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      setLayoutShrinkAmount(0);

      if (resetOnHide) {
        timers.push(
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }, 50)
        );
      } else {
        timers.push(
          setTimeout(() => {
            const layoutH =
              maxScrollLayoutHeightRef.current ||
              scrollLayoutHeightRef.current ||
              Dimensions.get('window').height;
            const naturalContentH = Math.max(
              0,
              contentHeightRef.current - AppliedExtraPaddingRef.current
            );
            const maxNaturalScrollY = Math.max(0, naturalContentH - layoutH);
            if (currentScrollYRef.current > maxNaturalScrollY) {
              scrollViewRef.current?.scrollTo({ y: maxNaturalScrollY, animated: true });
            }
          }, 60)
        );
      }
    };

    const showSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillShow', handleShow)
        : Keyboard.addListener('keyboardDidShow', handleShow);

    const hideSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillHide', handleHide)
        : Keyboard.addListener('keyboardDidHide', handleHide);

    return () => {
      clearTimers();
      showSub.remove();
      hideSub.remove();
    };
  }, [executeScrollTarget, resetOnHide]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentScrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height <= 0) return;

    scrollLayoutHeightRef.current = height;
    if (!isKeyboardVisibleRef.current || height > maxScrollLayoutHeightRef.current) {
      maxScrollLayoutHeightRef.current = height;
      setLayoutShrinkAmount(0);
    } else if (maxScrollLayoutHeightRef.current > height) {
      setLayoutShrinkAmount(maxScrollLayoutHeightRef.current - height);
    }
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height;
      if (isKeyboardVisibleRef.current && activeTargetRef.current) {
        setTimeout(() => {
          executeScrollTarget(activeTargetRef.current, activeCustomOffsetRef.current);
        }, 50);
      }
    },
    [executeScrollTarget]
  );

  const scrollToFocusedInput = useCallback(
    (inputRefOrNode: ScrollTarget, customOffset?: number) => {
      activeTargetRef.current = inputRefOrNode;
      activeCustomOffsetRef.current = customOffset;

      setTimeout(
        () => {
          executeScrollTarget(inputRefOrNode, customOffset);
        },
        Platform.OS === 'ios' ? 100 : 180
      );
    },
    [executeScrollTarget]
  );

  const scrollIntoView = useCallback(
    (targetOrOffset?: ScrollTarget, customOffset?: number) => {
      if (targetOrOffset === undefined || targetOrOffset === null) {
        scrollToFocusedInput('end', customOffset);
        return;
      }
      scrollToFocusedInput(targetOrOffset, customOffset);
    },
    [scrollToFocusedInput]
  );

  // When keyboard is closed, contentBottomPadding is strictly defaultBottomPadding (zero visual change).
  // When keyboard is open:
  // - On Android (edgeToEdgeEnabled=true), KeyboardAvoidingView has behavior=undefined and the window
  //   often does not shrink, or shrinks only partially. We add the uncompensated keyboard height plus
  //   comfortable breathing room so the user can freely scroll the entire form above the keyboard.
  // - On iOS, KeyboardAvoidingView already pads by the keyboard height, so we keep defaultBottomPadding
  //   (or at least 56px) for comfortable scrolling.
  const uncompensatedAndroidKbHeight =
    Platform.OS === 'android' ? Math.max(0, keyboardHeight - layoutShrinkAmount) : 0;

  const contentBottomPadding = isKeyboardVisible
    ? Platform.OS === 'android'
      ? defaultBottomPadding + uncompensatedAndroidKbHeight + 48
      : Math.max(defaultBottomPadding, 56)
    : defaultBottomPadding;

  AppliedExtraPaddingRef.current = Math.max(0, contentBottomPadding - defaultBottomPadding);

  return {
    scrollViewRef,
    scrollRef: scrollViewRef,
    isKeyboardVisible,
    keyboardHeight,
    handleScroll,
    handleLayout,
    handleContentSizeChange,
    scrollToFocusedInput,
    scrollIntoView,
    scrollToEnd: () => scrollToFocusedInput('end'),
    contentBottomPadding,
  };
}
