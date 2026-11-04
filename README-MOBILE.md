# Praia Alerta Guará — App Mobile (Expo)

Base nativa **100% isolada** do MVP web. Nada em `/app` (Next.js) foi alterado.

## Subir amanhã de manhã

```bash
cd app-mobile
npm install
npx expo start
```

Depois:

- **Android:** aperte `a` ou escaneie o QR no Expo Go  
- **iOS:** aperte `i` (macOS) ou Expo Go no iPhone  
- **Web preview:** `w` (mapa satélite limitado no browser)

### Emulador Android (se já tiver SDK)

```bash
cd app-mobile && npx expo start --android
```

## O que você vai ver

1. Splash do Guará  
2. Home com cards (Maré, Clima, Criança, Alertas) + slider de Emergência  
3. **Mapa híbrido** da Praia do Morro com:
   - guarda-corpo (dupla polyline madeira + pilastras tracejadas)
   - corredores das rampas
   - pins (quiosques, duchas, ambulantes, landmarks, academia)
   - filtros + camadas Sol/Maré
   - hold SOS com **vibração nativa** (iOS e Android via `expo-haptics`)
   - FAB do Guará

## Estrutura

```
app-mobile/
  App.tsx
  app.json
  src/
    assets/          # logos + poses do Guará
    components/      # mapa, overlays, Guará
    context/         # estado global (filtros, clima, SOS)
    data/            # cópias dos módulos do web (isoladas)
    hooks/
    navigation/
    screens/
    theme/
    utils/
  PARITY.md          # inventário web → mobile
```

## Isolamento

- Pasta nova: `app-mobile/`  
- Sem imports do Next.js / Leaflet / `app/*`  
- Web continua em produção sem risco  

Detalhes de paridade: `app-mobile/PARITY.md`.
