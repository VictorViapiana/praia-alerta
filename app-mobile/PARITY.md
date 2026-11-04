# Paridade Web → Mobile (Fase 2.1)

Inventário do MVP web vs. `app-mobile`. O web em `/app` **não foi modificado**.

## ✅ Fase 2.1 — produto pronto para beta

| Feature | Status nativo |
|---------|----------------|
| Splash / Home / Guará island + Q&A | `HomeScreen` + `GuaraChat` + `answerGuara` |
| Onboarding home + mapa | `TourOverlay` + `HOME_STEPS` / `MAP_STEPS` |
| Nossa Missão | `MissionModal` |
| Mapa híbrido + muro duplo + rampas + pins + Sol/Maré | `BeachMapView` |
| Ritual da ducha | `ShowerRitualModal` |
| Tip tours (Marlin, Golfinho, Academia, muro, rampa) | `TipTourModal` |
| Soft prompts GPS + notificações | `SoftPrompt` + AsyncStorage |
| Orla sentinel → push local | `useOrlaSentinel` + `pushOrlaNotice` |
| Fichas sponsor / ambulante / escuna | `SponsorSheet` |
| Rotas estilo Waze (preview + polyline + fit + seta GPS) | `RoutePreviewSheet` + `RouteLayer` + `UserArrow` + `NavHud` |
| SOS com coords reais + protocolo + tel:193 | `SosScreen` |
| Criança perdida (wizard completo) | `CriancaScreen` |
| Maré / Clima / Alertas | `FeatureScreen` |
| Haptics iOS/Android | `expo-haptics` |
| Speech Guará | `expo-speech` |

## Boot

```bash
cd app-mobile && npm install && npx expo start
```

## Lojas (depois do beta)

EAS Build, contas Apple/Google, privacidade, screenshots — fora do escopo 2.1.
