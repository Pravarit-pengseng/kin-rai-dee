import { router } from 'expo-router';

/**
 * Navigate back safely when a previous route exists; otherwise replace with fallback
 * to prevent "The action 'GO_BACK' was not handled by any navigator" errors.
 */
export function safeBack(fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
