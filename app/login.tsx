import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { useState } from "react";

export default function LoginScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await startOAuthLogin();
    } catch (error) {
      console.error("[Login] Error:", error);
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background">
      <View className="flex-1 items-center justify-center p-6 gap-8">
        {/* Logo/Title */}
        <View className="items-center gap-4">
          <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center">
            <Text className="text-4xl font-bold text-background">EWF</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground">Emergency Call Service</Text>
          <Text className="text-base text-muted text-center">
            Internal emergency call routing and incident management
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.border : colors.primary,
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 12,
            minWidth: 200,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text className="text-background text-center font-semibold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text className="text-sm text-muted text-center">
          Sign in with your EWF account to access the emergency call system
        </Text>
      </View>
    </ScreenContainer>
  );
}
