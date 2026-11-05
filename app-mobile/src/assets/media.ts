import type { ImageSourcePropType } from "react-native";
import { guarapariImage } from "./guarapari";

const CARDAPIO: Record<string, ImageSourcePropType> = {
  "/cardapio/camarao.jpg": require("./cardapio/camarao.jpg"),
  "/cardapio/drink.jpg": require("./cardapio/drink.jpg"),
  "/cardapio/chopp.jpg": require("./cardapio/chopp.jpg"),
  "/cardapio/porcao.jpg": require("./cardapio/porcao.jpg"),
  "/cardapio/peixe.jpg": require("./cardapio/peixe.jpg"),
  "/cardapio/acai.jpg": require("./cardapio/acai.jpg"),
};

/** Resolve qualquer path `/guarapari/...` ou `/cardapio/...` do web. */
export function mediaImage(path: string | undefined | null): ImageSourcePropType {
  if (!path) return guarapariImage(null);
  const key = (path.startsWith("/") ? path : `/${path}`).split("?")[0];
  if (CARDAPIO[key]) return CARDAPIO[key];
  return guarapariImage(key);
}
