import React, { useMemo } from 'react';
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

  return useMemo(() => {
    const rawTop = contextInsets?.top ?? initialWindowMetrics?.insets.top ?? 0;
    const rawBottom = contextInsets?.bottom ?? initialWindowMetrics?.insets.bottom ?? 0;
    const rawLeft = contextInsets?.left ?? initialWindowMetrics?.insets.left ?? 0;
    const rawRight = contextInsets?.right ?? initialWindowMetrics?.insets.right ?? 0;

    if (rawTop > 0) {
      cachedStableInsets = {
        ...cachedStableInsets,
        top: Math.max(rawTop, ANDROID_MIN_TOP_INSET),
      };
    }
    if (rawBottom > 0) {
      cachedStableInsets = {
        ...cachedStableInsets,
        bottom: Math.max(cachedStableInsets.bottom, rawBottom),
      };
    }
    if (rawLeft > 0) {
      cachedStableInsets = {
        ...cachedStableInsets,
        left: rawLeft,
      };
    }
    if (rawRight > 0) {
      cachedStableInsets = {
        ...cachedStableInsets,
        right: rawRight,
      };
    }

    return {
      top: Math.max(rawTop, cachedStableInsets.top, ANDROID_MIN_TOP_INSET),
      bottom: rawBottom > 0 ? rawBottom : cachedStableInsets.bottom,
      left: rawLeft > 0 ? rawLeft : cachedStableInsets.left,
      right: rawRight > 0 ? rawRight : cachedStableInsets.right,
    };
  }, [
    contextInsets?.top,
    contextInsets?.bottom,
    contextInsets?.left,
    contextInsets?.right,
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
