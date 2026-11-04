# Paridade Web → Mobile (Fase 2)

Inventário do MVP web espelhado em `app-mobile`. O web em `/app` **não foi modificado**.

## Telas / fluxos

| Web | Mobile |
|-----|--------|
| Splash Guará | `SplashScreen` |
| Home + Guará island + cards | `HomeScreen` |
| Mapa & Localização | `MapScreen` + `BeachMapView` |
| SOS hold / slider → alerta crítico | `SosHoldButton` / `SosSlider` → `SosScreen` (+ **expo-haptics**) |
| Maré / Clima sheets | `FeatureScreen` |
| Criança Perdida | `CriancaScreen` |
| Alertas | `FeatureScreen` (alertas) |
| Ficha de pin / landmark | bottom sheet no `MapScreen` |
| Fala do muro (para-peito) | modal Guará no mapa |

## Mapa

| Camada web | Mobile |
|------------|--------|
| Hybrid / satélite | `MapView` `mapType="hybrid"` |
| Guarda-corpo (dupla Polyline + dash) | `MuroPolylines` — mesmos coords `MURO_SUL_ATE_Q1` |
| Rampas (polígono + bordas) | `RampCorridors` ← `RAMPS` |
| Pins quiosques / hotéis / sorvetes / parceiros | `MapPins` ← `PLACES` |
| Duchas | `MapPins` ← `SHOWERS` |
| Ambulantes online | `MapPins` ← `AMBULANTES` |
| Landmarks (academia, bancos, golfinho…) | `MapPins` ← `ORLA_LANDMARKS` |
| Camadas Sol / Maré | `DayLayerOverlay` ← `day-layers.ts` |
| Filtros de categoria | `FilterChips` |
| Busca | campo no `MapChrome` |
| FAB Guará | `MapChrome` |
| Clima chip | `MapChrome` |

## Dados (cópias isoladas em `src/data`)

`orla-muro`, `places`, `rampas`, `walk-route`, `coast`, `sky-phase`, `day-layers`, `guara-guide`, `guara-poses`, `page-types`, `catalog`

## Ainda na Fase 2.1+

- Tour completo do Guará / onboarding / ritual da ducha  
- Navegação turn-by-turn (`walk-route` + heading beam)  
- Sponsor portal / escunas sheet ricos  
- Notificações orla / PWA → push nativo  
- Ícones cartoon custom (`/pins/*`) como `Marker` image  
- Missão modal + tip tours multi-step  

A base de arquitetura e o mapa com muro/rampas/pins/filtros/SOS háptico já estão prontos para rodar no Expo.
