import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
  type Edge,
  type EdgeInsets,
  type SafeAreaViewProps as RNCSafeAreaViewProps,
} from 'react-native-safe-area-context';

const ANDROID_MIN_TOP_INSET =
  Platform.OS === 'android' ? Math.max(RNStatusBar.currentHeight ?? 0, 24) : 0;

let cachedStableInsets: EdgeInsets = {
  top: Math.max(initialWindowMetrics?.insets.top ?? 0, ANDROID_MIN_TOP_INSET),
  bottom: initialWindowMetrics?.insets.bottom ?? 0,
  left: initialWindowMetrics?.insets.left ?? 0,
  right: initialWindowMetrics?.insets.right ?? 0,
};

const insetListeners = new Set<() => void>();

function notifyInsetListeners() {
  insetListeners.forEach((listener) => listener());
}

function normalizeEdgeList(edges?: RNCSafeAreaViewProps['edges']): Set<Edge> {
  if (!edges) {
    return new Set<Edge>(['top', 'bottom', 'left', 'right']);
  }
  if (Array.isArray(edges)) {
    return new Set<Edge>(edges as readonly Edge[]);
  }
  const record = edges as Readonly<Partial<Record<Edge, string>>>;
  const result = new Set<Edge>();
  (['top', 'bottom', 'left', 'right'] as const).forEach((edge) => {
    if (record[edge] && record[edge] !== 'off') {
      result.add(edge);
    }
  });
  return result;
}

export function useStableSafeAreaInsets(): EdgeInsets {
  let contextInsets: EdgeInsets | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextInsets = useSafeAreaInsets();
  } catch {
    contextInsets = null;
  }

  const [, setRevision] = useState(0);

  useEffect(() => {
    const listener = () => setRevision((r) => r + 1);
    insetListeners.add(listener);
    return () => {
      insetListeners.delete(listener);
    };
  }, []);

  const rawTop = contextInsets?.top ?? initialWindowMetrics?.insets.top ?? 0;
  const rawBottom = contextInsets?.bottom ?? initialWindowMetrics?.insets.bottom ?? 0;
  const rawLeft = contextInsets?.left ?? initialWindowMetrics?.insets.left ?? 0;
  const rawRight = contextInsets?.right ?? initialWindowMetrics?.insets.right ?? 0;

  useEffect(() => {
    let changed = false;
    const next = { ...cachedStableInsets };

    const candidateTop = Math.max(rawTop, ANDROID_MIN_TOP_INSET);
    if (candidateTop > next.top) {
      next.top = candidateTop;
      changed = true;
    }
    if (rawBottom > next.bottom) {
      next.bottom = rawBottom;
      changed = true;
    }
    if (rawLeft > next.left) {
      next.left = rawLeft;
      changed = true;
    }
    if (rawRight > next.right) {
      next.right = rawRight;
      changed = true;
    }

    if (changed) {
      cachedStableInsets = next;
      notifyInsetListeners();
    }
  }, [rawTop, rawBottom, rawLeft, rawRight]);

  return useMemo(() => {
    return {
      top: Math.max(rawTop, cachedStableInsets.top, ANDROID_MIN_TOP_INSET),
      bottom: Math.max(rawBottom, cachedStableInsets.bottom),
      left: Math.max(rawLeft, cachedStableInsets.left),
      right: Math.max(rawRight, cachedStableInsets.right),
    };
  }, [
    rawTop,
    rawBottom,
    rawLeft,
    rawRight,
    cachedStableInsets.top,
    cachedStableInsets.bottom,
    cachedStableInsets.left,
    cachedStableInsets.right,
  ]);
}

export type StableSafeAreaViewProps = ViewProps & {
  edges?: RNCSafeAreaViewProps['edges'];
  mode?: 'padding' | 'margin';
};

function toNumericSpacing(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export const SafeAreaView = React.forwardRef<React.ComponentRef<typeof View>, StableSafeAreaViewProps>(
  function SafeAreaView({ edges, mode = 'padding', style, children, ...rest }, ref) {
    const insets = useStableSafeAreaInsets();
    const activeEdges = useMemo(() => normalizeEdgeList(edges), [edges]);

    const computedStyle = useMemo(() => {
      const flat = (StyleSheet.flatten(style) || {}) as ViewStyle;

      if (mode === 'margin') {
        const baseTop = toNumericSpacing(flat.marginTop ?? flat.marginVertical ?? flat.margin);
        const baseBottom = toNumericSpacing(flat.marginBottom ?? flat.marginVertical ?? flat.margin);
        const baseLeft = toNumericSpacing(flat.marginLeft ?? flat.marginHorizontal ?? flat.margin);
        const baseRight = toNumericSpacing(flat.marginRight ?? flat.marginHorizontal ?? flat.margin);

        return [
          style,
          {
            marginTop: baseTop + (activeEdges.has('top') ? insets.top : 0),
            marginBottom: baseBottom + (activeEdges.has('bottom') ? insets.bottom : 0),
            marginLeft: baseLeft + (activeEdges.has('left') ? insets.left : 0),
            marginRight: baseRight + (activeEdges.has('right') ? insets.right : 0),
          },
        ];
      }

      const baseTop = toNumericSpacing(flat.paddingTop ?? flat.paddingVertical ?? flat.padding);
      const baseBottom = toNumericSpacing(flat.paddingBottom ?? flat.paddingVertical ?? flat.padding);
      const baseLeft = toNumericSpacing(flat.paddingLeft ?? flat.paddingHorizontal ?? flat.padding);
      const baseRight = toNumericSpacing(flat.paddingRight ?? flat.paddingHorizontal ?? flat.padding);

      return [
        style,
        {
          paddingTop: baseTop + (activeEdges.has('top') ? insets.top : 0),
          paddingBottom: baseBottom + (activeEdges.has('bottom') ? insets.bottom : 0),
          paddingLeft: baseLeft + (activeEdges.has('left') ? insets.left : 0),
          paddingRight: baseRight + (activeEdges.has('right') ? insets.right : 0),
        },
      ];
    }, [activeEdges, insets.bottom, insets.left, insets.right, insets.top, mode, style]);

    return (
      <View ref={ref} style={computedStyle} {...rest}>
        {children}
      </View>
    );
  }
);
