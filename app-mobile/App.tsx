import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/context/AppContext";
import { AmbulanteLiveProvider } from "./src/context/AmbulanteLiveContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

/**
 * Praia Alerta Guará — app nativo (Expo).
 * Isolado do MVP web em /app. Nunca importa código do Next.js.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AmbulanteLiveProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AmbulanteLiveProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
