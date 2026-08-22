# Talking Ben for Windows

Ad-free Windows desktop app inspired by the classic Talking Ben experience.

**Original character art and audio.** This project does **not** redistribute proprietary Talking Ben assets.

## Features

- Native Windows `.exe` via Electron (not an Android emulator / APK wrapper)
- Push-to-talk and continuous conversation modes
- Voice activity detection → speech recognition → Ben replies → TTS
- Canvas character with idle, blink, talk, laugh, and reaction animations
- Mouse interactions (face, belly, phone, etc.)
- Modular providers for speech, TTS, and conversation (offline-first)
- Local settings, no account, no advertising, no telemetry by default

## Requirements

- Node.js 20+
- Windows 10/11 for the full microphone + speech experience
- (Optional) Windows build machine or CI for NSIS installer artifacts

## Quick start

```bash
npm install
npm start
```

Development with DevTools:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Build and run |
| `npm run build` | Compile TypeScript + bundle renderer |
| `npm test` | Smoke tests |
| `npm run verify:no-ads` | Scan for advertising SDKs/terms |
| `npm run dist` | Build Windows installer + portable exe |
| `npm run dist:portable` | Portable `TalkingBen.exe` |
| `npm run dist:nsis` | `TalkingBen-Setup.exe` |

## Packaging (Windows)

On Windows (recommended for the NSIS installer):

```bash
npm run icons
npm run dist
```

Artifacts in `release/`:

- `TalkingBen.exe` — portable single-file launcher (electron-builder portable target)
- `TalkingBen-Setup.exe` — NSIS installer (desktop + Start Menu shortcuts)
- `win-unpacked/TalkingBen.exe` — unpacked app executable (PE32+ Windows binary)

On Linux you can still produce the unpacked Windows app + zip:

```bash
npm run pack:zip
```

GitHub Actions (`.github/workflows/build-windows.yml`) builds installer artifacts on `windows-latest`.

## Technology

Electron · HTML5 · CSS3 · TypeScript · Canvas 2D · Web Audio · Web Speech (STT/TTS) · modular local conversation engine

## Architecture

```
src/
  main/           Electron main process, IPC, settings persistence
  renderer/       UI shell
  character/      Canvas character controller
  animation/      Poses, visemes, idle motion
  audio/          Central AudioManager (procedural SFX)
  speech/         SpeechProvider + VAD + VoicePipeline
  tts/            TTSProvider implementations
  conversation/   Local Ben personality (+ optional online interface)
  interaction/    Modular click reactions
  settings/       Renderer settings helper
  ui/             Mic indicator, settings panel, toasts
```

Provider interfaces:

- `SpeechProvider`
- `TTSProvider`
- `ConversationProvider`
- `CharacterController` / `AnimationController`
- `AudioManager`

Swap providers without rewriting the app. Configure optional online endpoints via `.env` (see `.env.example`) — offline local conversation works with no keys.

## Voice modes

1. **Push-to-talk** — hold the Mic control, speak, release.
2. **Conversation** — continuous listen; VAD detects end of speech and Ben answers automatically.

Mic indicator states: Idle · Listening · Processing · Speaking.

If Web Speech is unavailable, enable **Local stub** in Settings and type to Ben.

## Privacy

- No advertising SDKs, banners, or tracking
- No account system
- Microphone used only for VAD / speech recognition
- Settings stored locally (`electron-store`)
- Telemetry off unless you explicitly enable it (default: off)

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- Sandboxed renderer + preload bridge
- Validated IPC channels
- No remote page loading

## License

MIT — original code and assets in this repository.
