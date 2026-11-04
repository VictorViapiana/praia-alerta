import type { FeatureId } from "../data/catalog";
import type { StoryId } from "../data/orla-stories";

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Map: undefined;
  Sos: undefined;
  Feature: { id: FeatureId };
  Crianca: undefined;
  Story: { id: StoryId };
  AmbulantePortal: undefined;
  Camera: undefined;
};
