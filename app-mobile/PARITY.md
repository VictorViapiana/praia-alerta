# Paridade Web → Mobile (Fase 2)

Inventário do MVP web (varredura completa) vs. o que já está em `app-mobile`.  
O web em `/app` **não foi modificado**.

## ✅ Base pronta (Fase 2.0)

| Web | Mobile |
|-----|--------|
| Splash Guará | `SplashScreen` |
| Home + Guará + cards serviços | `HomeScreen` |
| Mapa & Localização | `MapScreen` + `BeachMapView` |
| SOS hold / slider → alerta | `SosHoldButton` / `SosSlider` → `SosScreen` + **expo-haptics** |
| Maré / Clima / Alertas | `FeatureScreen` |
| Criança Perdida (fluxo base) | `CriancaScreen` |
| Ficha rápida de pin / landmark | bottom sheet no `MapScreen` |
| Fala do muro (para-peito) | modal Guará no mapa |
| Guarda-corpo (dupla Polyline) | `MuroPolylines` ← `MURO_SUL_ATE_Q1` |
| Rampas (polígono + bordas) | `RampCorridors` ← `RAMPS` |
| Pins (quiosques, duchas, ambulantes, landmarks, academia) | `MapPins` |
| Camadas Sol / Maré | `DayLayerOverlay` |
| Filtros + busca + FAB Guará + chip clima | `MapChrome` / `FilterChips` |
| GPS suave | `useUserLocation` |
| Dados espelhados | `src/data/*` (cópias isoladas) |

## 🔜 Fase 2.1 — backlog (inventário web completo)

### Telas / overlays ainda não portados

| Web | Arquivo origem | Prioridade |
|-----|----------------|------------|
| Guará island Q&A (`HOME_PROMPTS` / `answerGuara`) | `page.tsx`, `guara-guide.ts` | Alta |
| MissionModal “Nossa Missão” | `mission-modal.tsx` | Média |
| GuaraOnboarding (home + mapa) | `guara-onboarding.tsx` | Alta |
| GuaraMapChat + convite à praia | `guara-map.tsx` | Alta |
| GuaraTipTour (Marlin, Golfinho, Academia, muro, rampa) | `guara-tip-tour.tsx` | Alta |
| GuaraShowerRitual | `guara-shower-ritual.tsx` | Alta |
| Landmark talk dialog (banheiros, pier…) | `page.tsx` | Média |
| SponsorSheet / AmbulanteSheet / EscunaSheet | `sponsor-portal.tsx`, `marker-popup.tsx` | Alta |
| RouteChoice + NavDrive (OSRM) | `route-choice.tsx`, `nav-drive.tsx`, `walk-route.ts` | Alta |
| TouristCamera + frame | `tourist-camera.tsx` | Média |
| LocationSoftPrompt / NotifySoftPrompt | `location-soft-prompt.tsx`, `notify-soft-prompt.tsx` | Alta |
| Orla sentinel (proximidade → notify) | `orla-sentinel.tsx`, `orla-notify.ts` | Alta |
| Orla cards ricos (MarlinScreen, Fotos, Flags) | `orla.tsx` | Média |
| Crianca wizard multi-etapas completo | `crianca-perdida.tsx` | Média |
| HomeScreenHint / PWA → nativo | `home-screen-hint.tsx` | Baixa |
| MuroCaptureTool (dev) | `beach-map.tsx` | Dev only |

### Camadas / UX de mapa faltantes

- Pins cartoon (`/public/pins/*`) como `Marker` image  
- Escuna + Marlin pins dedicados  
- Ambulantes caminhando (simulação)  
- Heading beam / bússola (`expo-sensors`)  
- Dual polyline da rota + chevrons de navegação  
- Basemap “clean” / drive mode (além do hybrid)  

### Módulos Expo sugeridos (2.1)

`expo-notifications`, `expo-speech`, `expo-camera`, `expo-sharing`, `expo-clipboard`, `expo-sensors`, `@react-native-async-storage/async-storage`, `react-native-reanimated` + Gesture Handler.

### Rede (já compatível com RN)

- Open-Meteo forecast + marine (`coast.ts`)  
- OSRM routing (`walk-route.ts`)  
- Tiles Esri via `MapView` / UrlTile se precisar de basemap custom  

## Como rodar

Ver `README-MOBILE.md` na raiz do repo:

```bash
cd app-mobile && npm install && npx expo start
```
