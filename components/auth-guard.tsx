import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

/**
 * Auth Guard Component
 * 
 * Protects routes by checking if user is authenticated.
 * Redirects to login if not authenticated.
 * Redirects to home if authenticated and on login page.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const onLoginPage = segments[0] === "login";

    if (!user && !onLoginPage) {
      // User not authenticated and not on login page -> redirect to login
      router.replace("/login");
    } else if (user && onLoginPage) {
      // User authenticated and on login page -> redirect to home
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
