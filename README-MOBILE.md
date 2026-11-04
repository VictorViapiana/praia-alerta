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

## O que você vai ver (Fase 2.1+)

1. Splash + onboarding do Guará  
2. Home com Q&A, Nossa Missão, stories (Marlin/Fotos/Bandeiras), câmera e SOS  
3. **Mapa híbrido** com muro, rampas, pins, Sol/Maré, busca ranqueada  
4. Ritual da ducha, tip tours, portal de patrocinador  
5. Rotas estilo Waze (preview, polyline, câmera, seta GPS)  
6. Notificações da orla (toque abre o spot) + soft prompts  
7. SOS + criança perdida (wizard com 2º contato)  
8. **Painel do ambulante** Online/Offline → pin ao vivo na areia

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
