import { Text, TextProps } from 'react-native';

export default function AppText(props: TextProps) {
  return <Text {...props} allowFontScaling={false} />;
}
