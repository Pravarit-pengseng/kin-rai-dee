import { Platform } from 'react-native';

export const Typography = {
  regular: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_400Regular',
    default: 'NotoSansThai_400Regular',
  }),
  semiBold: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_600SemiBold',
    default: 'NotoSansThai_600SemiBold',
  }),
  bold: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_700Bold',
    default: 'NotoSansThai_700Bold',
  }),
};

export const FontFamily = Typography;
export default Typography;
