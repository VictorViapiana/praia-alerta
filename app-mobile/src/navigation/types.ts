import type { FeatureId } from "../data/catalog";

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Map: undefined;
  Sos: undefined;
  Feature: { id: FeatureId };
  Crianca: undefined;
};
