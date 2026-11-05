import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { SosScreen } from "../screens/SosScreen";
import { FeatureScreen } from "../screens/FeatureScreen";
import { CriancaScreen } from "../screens/CriancaScreen";
import { StoryScreen } from "../screens/StoryScreen";
import { AmbulantePortalScreen } from "../screens/AmbulantePortalScreen";
import { CameraScreen } from "../screens/CameraScreen";
import { NotifyBridge } from "./NotifyBridge";
import type { RootStackParamList } from "./types";
import { useState } from "react";

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0b2a48",
    card: "#0f172a",
    primary: "#38bdf8",
  },
};

export function RootNavigator() {
  const [booting, setBooting] = useState(true);

  if (booting) {
    return <SplashScreen onDone={() => setBooting(false)} />;
  }

  return (
    <NavigationContainer theme={theme}>
      <NotifyBridge />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Sos" component={SosScreen} options={{ animation: "fade", presentation: "fullScreenModal" }} />
        <Stack.Screen name="Feature" component={FeatureScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Crianca" component={CriancaScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Story" component={StoryScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="AmbulantePortal" component={AmbulantePortalScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ animation: "fade", presentation: "fullScreenModal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
