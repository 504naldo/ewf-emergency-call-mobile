import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/constants/oauth";

export default function LoginScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    // Validate API URL
    const apiUrl = getApiBaseUrl();
    console.log("[Login] Using API URL:", apiUrl);
    if (!apiUrl) {
      Alert.alert(
        "Configuration Error",
        "API URL is not configured. Please contact support."
      );
      return;
    }

    // Check for expired sandbox URLs
    if (apiUrl.includes(".manus.computer") && apiUrl.includes("-")) {
      Alert.alert(
        "Expired Build",
        "This build is using a temporary API URL that has expired. Please download the latest version from your administrator."
      );
      return;
    }

    setLoading(true);
    try {
      // Use XMLHttpRequest instead of fetch() to bypass React Native's URL validation bug
      // React Native's fetch() has a known issue on Android where it throws "Invalid URL"
      // even with valid hardcoded HTTPS URLs. XMLHttpRequest works reliably.
      const response = await new Promise<{ status: number; data: any }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${apiUrl}/api/auth/login`;
        
        console.log("[Login] XMLHttpRequest to:", url);
        
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, data });
          } catch (e) {
            reject(new Error("Invalid response from server"));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network request failed"));
        };
        
        xhr.ontimeout = () => {
          reject(new Error("Request timeout"));
        };
        
        xhr.timeout = 30000; // 30 second timeout
        
        xhr.send(JSON.stringify({ email, password }));
      });

      if (response.status !== 200) {
        throw new Error(response.data.error || "Login failed");
      }

      // Store token and user via AuthContext
      await login(response.data.token, response.data.user);
      
      console.log("[Login] Login successful, auth state updated");
      // No need to navigate - AuthGuard will automatically render the app
    } catch (error: any) {
      console.error("[Login] Error:", error);
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background">
      <View className="flex-1 items-center justify-center p-6 gap-8">
        {/* Logo/Title */}
        <View className="items-center gap-4">
          <Image
            source={{ 
              uri: colorScheme === "dark" 
                ? "https://files.manuscdn.com/user_upload_by_module/session_file/113852657/njoEbWIGAcCvLOcK.png"
                : "https://files.manuscdn.com/user_upload_by_module/session_file/113852657/nPOljwohFWrZoKjw.png"
            }}
            style={{ width: 280, height: 100 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-foreground">Emergency Call Service</Text>
          <Text className="text-base text-muted text-center">
            Internal emergency call routing and incident management
          </Text>
        </View>

        {/* Login Form */}
        <View className="w-full max-w-sm gap-4">
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.border : colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
             ) : (
              <Text className="text-background text-center font-semibold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Credentials */}
        <View className="bg-surface border border-border rounded-xl p-4 w-full max-w-sm">
          <Text className="text-sm font-semibold text-foreground mb-2">Demo Credentials:</Text>
          <Text className="text-sm text-muted">Email: ranaldo@ewandf.ca</Text>
          <Text className="text-sm text-muted">Password: ewf2024!</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}