# Astral Blaze Client

**Astral Blaze** is a premium, lightweight **Fabric client-side mod** for **Minecraft 1.21.11**. It is a polished HUD / visual / performance client you drop into `.minecraft/mods` — not a launcher, not Electron, and not a cheat client.

The interface is built around frosted-glass panels, a configurable accent color, and a white-first default theme. Rendering is designed to stay cheap: HUD text is cached, ping is sampled about once a second from the vanilla tab list, rounded panels use shipped 9-slice textures, and configuration is written on a debounce rather than every frame.

## Minecraft version

| | |
|---|---|
| Client | Astral Blaze **1.0.0** |
| Minecraft | **1.21.11** |
| Loader | **Fabric** |
| Java | **21+** |
| Required | [Fabric API](https://modrinth.com/mod/fabric-api) |

## Features

- Custom main menu branding, versions, and an **Astral Blaze Settings** button
- Configurable title-screen backgrounds: panorama, custom PNG/JPG, solid, gradient, lightweight animated wash
- **Right Shift** client menu with search, module cards, and a home dashboard
- ESC / pause-menu **Astral Blaze** button (vanilla buttons stay)
- Visual **HUD Editor** with drag, scale, glass panels, and snap guides
- HUD: FPS (min/avg/max), ping, keystrokes, CPS, armor, potions, coordinates, direction, biome, clock, session time, server, memory, speed, status, custom crosshair
- Visual: fullbright, zoom (default **C**), hurt-cam / view-bob / vignette / fire / pumpkin overlays
- Performance center with FPS, frame time, RAM, entity count, render / simulation distance, particle amount, weather hide, Reduce Motion
- Themes: Astral White, Dark Glass, Midnight, Minimal, Custom (accent, opacity, radius, shadow, animation)
- Profiles: Default, PvP, Recording, Low FPS, Custom — create, load, save, duplicate, delete, export/import as JSON
- Toast notifications, keybind manager (vanilla Controls screen + conflict detection)
- Optional [Mod Menu](https://modrinth.com/mod/modmenu) entry: **Open Astral Blaze**

## Installation

1. Install Minecraft **1.21.11**.
2. Install [Fabric Loader](https://fabricmc.net/use/installer/) **0.19.5+** for that version.
3. Place **Fabric API** and `Astral-Blaze-Client-1.0.0+1.21.11.jar` into `.minecraft/mods`.
4. Launch the Fabric 1.21.11 profile.

Custom title backgrounds go in:

```
.minecraft/config/astralblaze/backgrounds/
```

PNG, JPG, and JPEG are supported. The first file (sorted by name) is used and cached — it is not reloaded every frame.

## Controls

| Action | Default |
|---|---|
| Open Astral Blaze menu | **Right Shift** |
| HUD Editor | **Right Control** |
| Zoom | **C** (hold) |

Bindings are listed under **Options → Controls → Astral Blaze** and can be changed. Conflicting client binds are flagged on the Settings page.

## HUD Editor

Open it from the Home dashboard or the HUD Editor key. Drag elements, snap to screen center, edges, and other widgets, then use **Reset** to restore the default position. Each element has enable, scale, opacity, color, background, border, and corner radius settings in the client menu.

## Profiles and themes

Configuration lives in `config/astralblaze/`:

- `config.json`
- `hud.json`
- `modules.json`
- `themes.json`
- `profiles/*.json`

Saves are debounced (~750 ms after the last change). Profiles can be duplicated and copied as JSON files.

## Performance

Astral Blaze is written so the client itself is not the reason frames drop:

- No per-frame texture loads
- No extra ping packets
- HUD strings refresh only when the source data changes
- Glass UI uses prebuilt 9-slice textures instead of live Gaussian blur
- **Reduce Motion** skips menu and zoom easing
- Particle amount and weather rendering are optional and off by default except for the particle slider at 100%

You can use Sodium, Lithium, ImmediatelyFast, Entity Culling, and FerriteCore alongside Astral Blaze when those mods support 1.21.11. They are not bundled.

## Compatibility

Designed to sit next to:

- Fabric API (required)
- Mod Menu (optional)
- Sodium, Lithium, ImmediatelyFast, Entity Culling, FerriteCore

Mixins are limited to title/pause branding, zoom FOV, overlay hides, fullbright brightness, weather skip, and particle chance. Vanilla gameplay is not modified on the server.

## Safe / legitimate design

Astral Blaze is a **QoL and visual client**. It does **not** include KillAura, aim assist, reach, velocity, autoclicker, fly, speed, scaffold, NoFall, X-ray, triggerbot, packet manipulation, timer, hitbox changes, or anti-cheat bypasses. CPS and keystrokes are displays only.

## Building from source

**Java 21** is required.

```bash
./gradlew build
```

Windows:

```bat
BUILD.bat
```

The production JAR is:

```
build/libs/Astral-Blaze-Client-1.0.0+1.21.11.jar
```

`BUILD.bat` copies that JAR into `release/` and writes `Astral-Blaze-Client-1.21.11.zip` containing the JAR plus a short `README.txt`. Sources are not included in the zip.

## GitHub Actions

`.github/workflows/build.yml` runs on push, pull request, and workflow_dispatch. It builds with Java 21, verifies the JAR, packs `Astral-Blaze-Client-1.21.11.zip`, and uploads an artifact named **Astral-Blaze-Client-1.21.11**.

## License

MIT. See [LICENSE](LICENSE).
