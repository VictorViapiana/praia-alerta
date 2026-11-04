# Paridade Web → Mobile (Fase 2.1+)

Inventário do MVP web vs. `app-mobile`. O web em `/app` **não foi modificado**.
Integração com posto de salva-vidas: **adiada** (protocolo local permanece).

## ✅ Produto nativo — paridade + extras

| Feature | Status nativo |
|---------|----------------|
| Splash / Home / Guará island + Q&A | `HomeScreen` + `GuaraChat` + `answerGuara` |
| Onboarding home + mapa | `TourOverlay` + `HOME_STEPS` / `MAP_STEPS` |
| Nossa Missão | `MissionModal` |
| Stories orla (Marlin / Fotos / Bandeiras) | `StoryScreen` + cards na Home |
| Chip bandeira amarela | Home → léxico de bandeiras |
| Mapa híbrido + muro + rampas + pins + Sol/Maré | `BeachMapView` |
| Busca ranqueada no mapa | `MapSearchHits` |
| Ritual da ducha | `ShowerRitualModal` |
| Tip tours (Marlin, Golfinho, Academia, muro, rampa) | `TipTourModal` |
| Soft prompts GPS + notificações | `SoftPrompt` + AsyncStorage |
| Orla sentinel com histerese/reentrada | `useOrlaSentinel` |
| Toque na notificação → abre spot | `useNotifyOpen` |
| Portal patrocinador (abas, carimbo, share) | `SponsorSheet` |
| Ambulantes: gift, walks, pin carrinho | sheet + `MapPins` |
| **Painel ambulante Online/Offline** | `AmbulantePortal` + `ambulante-hub` + live pins |
| Rotas estilo Waze | `RoutePreviewSheet` + `RouteLayer` + `UserArrow` + `NavHud` |
| SOS com coords reais + protocolo + tel:193 | `SosScreen` |
| Criança perdida (wizard + 2º contato) | `CriancaScreen` |
| Maré / Clima / Alertas ricos | `FeatureScreen` |
| Moldura Eu amo Guarapari | `CameraScreen` |
| Haptics + Speech Guará | `expo-haptics` / `expo-speech` |

## Ambulantes ao vivo

1. Home → **Sou ambulante** → registrar/login (telefone + PIN).
2. Alternar **Online / Offline**.
3. Online → pin no mapa (GPS heartbeat); Offline → some.
4. Sync local + opcional `EXPO_PUBLIC_AMBULANTE_HUB_URL` para hub remoto.

## Boot

```bash
cd app-mobile && npm install && npx expo start
```

## Fora do escopo (agora)

- Integração posto de salva-vidas (Fase 2.2)
- EAS / lojas Apple e Google
