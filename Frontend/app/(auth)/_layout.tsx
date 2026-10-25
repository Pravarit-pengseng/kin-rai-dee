import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFF8ED' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
    </Stack>
  );
}
