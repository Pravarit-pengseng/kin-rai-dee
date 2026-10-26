import { Platform } from 'react-native';

export const Typography = {
  regular: Platform.select({
    ios: 'NotoSansThai_400Regular',
    android: 'NotoSansThai_400Regular',
    default: 'NotoSansThai_400Regular',
  }),
  semiBold: Platform.select({
    ios: 'NotoSansThai_600SemiBold',
    android: 'NotoSansThai_600SemiBold',
    default: 'NotoSansThai_600SemiBold',
  }),
  bold: Platform.select({
    ios: 'NotoSansThai_700Bold',
    android: 'NotoSansThai_700Bold',
    default: 'NotoSansThai_700Bold',
  }),
};

export const FontFamily = Typography;
export default Typography;
