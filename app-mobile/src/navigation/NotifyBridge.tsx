import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { useNotifyOpen } from "../hooks/useNotifyOpen";
import type { RootStackParamList } from "./types";

/** Escuta toque em notificação em qualquer tela e abre o Map no spot. */
export function NotifyBridge() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setSelectedId, queueNotifySpot } = useApp();

  useNotifyOpen(
    useCallback(
      (spot) => {
        queueNotifySpot(spot);
        setSelectedId(spot);
        navigation.navigate("Map");
      },
      [navigation, queueNotifySpot, setSelectedId],
    ),
  );

  return null;
}
