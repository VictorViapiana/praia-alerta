import type { ImageSourcePropType } from "react-native";

/** Resolve paths `/guarapari/...` do web → require() local do Expo. */
const BY_PATH: Record<string, ImageSourcePropType> = {
  "/guarapari/praia-verao.jpg": require("./praia-verao.jpg"),
  "/guarapari/praia-orla.jpg": require("./praia-orla.jpg"),
  "/guarapari/praia-sul.jpg": require("./praia-sul.jpg"),
  "/guarapari/praia-vista.jpg": require("./praia-vista.jpg"),
  "/guarapari/praia-enseada.jpg": require("./praia-enseada.jpg"),
  "/guarapari/marlin-por-do-sol.jpg": require("./marlin-por-do-sol.jpg"),
  "/guarapari/marlin-rochas.png": require("./marlin-rochas.png"),
  "/guarapari/marlin-aerea.png": require("./marlin-aerea.png"),
  "/guarapari/marlin-agua.png": require("./marlin-agua.png"),
  "/guarapari/academia-orla.jpg": require("./academia-orla.jpg"),
};

export function guarapariImage(path: string | undefined | null): ImageSourcePropType {
  if (!path) return BY_PATH["/guarapari/praia-orla.jpg"];
  const key = path.startsWith("/") ? path.split("?")[0] : `/${path}`.split("?")[0];
  return BY_PATH[key] ?? BY_PATH["/guarapari/praia-orla.jpg"];
}
