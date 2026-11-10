# ALLIFLY — Comprehensive Technical Architecture & Engineering Manual

This document provides complete architectural specifications, mathematical formulations, rendering pipelines, physics calculations, and subsystem blueprints for **Allifly**.

---

## Table of Contents
1. [Architectural Overview & Lifecycle](#1-architectural-overview--lifecycle)
2. [3D Graphics & Three.js Rendering Pipeline](#2-3d-graphics--threejs-rendering-pipeline)
3. [Aerospace Flight Physics & Kinematics](#3-aerospace-flight-physics--kinematics)
4. [Procedural Asset Generation (Zero-Dependency Engine)](#4-procedural-asset-generation-zero-dependency-engine)
5. [Procedural Audio Synthesis Architecture](#5-procedural-audio-synthesis-architecture)
6. [Economy, Progression & Upgrade Mathematics](#6-economy-progression--upgrade-mathematics)
7. [Input Subsystem & Cross-Platform Hardware Handling](#7-input-subsystem--cross-platform-hardware-handling)
8. [Data Persistence & State Management](#8-data-persistence--state-management)
9. [Mobile & Desktop PWA Packaging Specifications](#9-mobile--desktop-pwa-packaging-specifications)

---

## 1. Architectural Overview & Lifecycle

Allifly is built with a decoupled architecture that completely separates high-frequency 60fps simulation state from React's DOM rendering cycle.

### Key Lifecycle Principles:
- **Isolated Canvas Container (`mountRef`)**: The WebGL `<canvas>` is instantiated once in `SpaceScene.ts` and mounted inside an empty DOM ref. React state changes (such as speed updates or modal dialogs) never trigger a re-mount or tear-down of the Three.js scene graph.
- **Delta-Clamped Game Loop**: Frame delta time is retrieved via `THREE.Clock.getDelta()` and clamped:
  $$\Delta t = \min(\text{raw}\Delta t, 0.05)$$
  This prevents physics tunneling or runaway position jumps if a browser tab loses focus.
- **Zero Garbage Collection (GC) in Render Loop**: All temporary mathematical vectors (`_v1`, `_v2`, `_forward`, `_up`, `_right`, `_quat`) are pre-allocated at module scope. No object allocation (`new THREE.Vector3()`) takes place inside per-frame animation loops.

---

## 2. 3D Graphics & Three.js Rendering Pipeline

### Renderer Configuration (`WebGLRenderer`):
- **Software WebGL Guard**: Evaluates the GPU unmasked renderer string via `WEBGL_debug_renderer_info` to detect virtualized environments (`SwiftShader`, `llvmpipe`, `softpipe`). On software environments, pixel ratio is capped at 1.0 and expensive multi-pass shadow calculations are streamlined to maintain 60fps.
- **Color Space & Tone Mapping**:
  - `renderer.outputColorSpace = THREE.SRGBColorSpace;`
  - `renderer.toneMapping = THREE.ACESFilmicToneMapping;`
  - `renderer.toneMappingExposure = 1.15;`
- **PMREM Studio Reflection Map**: A zero-dependency procedural environment map is generated at startup using `PMREMGenerator` and `RoomEnvironment(0.04)`. High-metalness materials (`metalness > 0.8`) and transmissive cockpit glass (`transmission = 0.85`, `ior = 1.5`) calculate realistic ambient reflections across deep space.

### Scene Hierarchy:
```
Scene
├── Ambient & Directional Sun Lights (0xfffbeb, intensity 2.5)
├── Hemisphere Fill Light (0x38bdf8 / 0x0f172a, intensity 0.85)
├── Starfield Points (3,800 colored vertices)
├── Asteroid Field InstancedMesh (220 randomized rock boulders)
├── Space Dust Stream (220 particles wrapped dynamically around ship)
├── Planetary System Groups [Terra Nova, Solara, Glacies, Ignis, Xenon, Chronos]
│   ├── Planet Spheres (MeshStandardMaterial with canvas procedural textures)
│   ├── Outer Atmosphere Glow (BackSide Sphere with AdditiveBlending)
│   ├── Swirling Cloud Spheres (Transparent normal-blended canvas maps)
│   ├── Planetary Ring Meshes (DoubleSide RingGeometry with radial alpha)
│   └── Orbiting Moon Meshes
├── Space Station Groups [Aegis Orbital, Hyperion Outpost]
│   ├── Central Cylindrical Core
│   ├── Rotating Torus Living Hub
│   ├── Solar Panel Wings
│   └── PointLight Navigation Beacons
├── Space Energy Crystals (OctahedronGeometry with inner core & PointLight)
├── Spaceship Group (Player Ship)
│   ├── Center Fuselage & Aerodynamic Wings
│   ├── Cockpit Canopy Glass & Interior Pilot Console
│   ├── Engine Thrusters & PointLights
│   └── Exhaust Flame Cones
└── Surface Environment Group (Active only during planetary landing)
    ├── Terrain PlaneGeometry (600x600 heightfield)
    ├── Landing Pad with perimeter runway lights
    └── Planetary Sky Dome (BackSide SphereGeometry)
```

---

## 3. Aerospace Flight Physics & Kinematics

### Orientation Standard:
In accordance with Three.js camera standards:
- **Forward Vector ($\vec{F}$)**: $\begin{bmatrix} 0 \\ 0 \\ -1 \end{bmatrix}$ (Negative Z)
- **Up Vector ($\vec{U}$)**: $\begin{bmatrix} 0 \\ 1 \\ 0 \end{bmatrix}$ (Positive Y)
- **Right Vector ($\vec{R}$)**: $\begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix}$ (Positive X)

All spaceship models have their nose oriented at $-Z$ and engine nozzles at $+Z$.

### Velocity & Acceleration Integration:
$$\vec{v}_{\text{target}} = \vec{F}_{\text{world}} \cdot (T \cdot v_{\text{max}})$$
where $T \in [-0.6, 1.0]$ is current throttle input.

Velocity smoothing uses exponential damping:
$$v_{\text{current}} = \text{Damp}(v_{\text{current}}, v_{\text{target}}, \lambda_{\text{accel}}, \Delta t)$$
$$\vec{P}_{\text{ship}}(t + \Delta t) = \vec{P}_{\text{ship}}(t) + \vec{v}_{\text{ship}} \cdot \Delta t$$

### Rotational Dynamics & Natural Jet Banking:
Steering inputs produce an angular velocity target $\vec{\omega}_{\text{target}}$:
$$\vec{\omega}_{\text{target}} = \begin{bmatrix}
\text{pitchInput} \cdot R_{\text{turn}} \\
\text{yawInput} \cdot R_{\text{turn}} \\
\text{rollInput} \cdot (1.5 \cdot R_{\text{turn}}) + \text{yawInput} \cdot (0.45 \cdot R_{\text{turn}})
\end{bmatrix}$$

Notice the **auto-banking term** ($\text{yawInput} \cdot 0.45 \cdot R_{\text{turn}}$): when turning left, the left wing rolls down into the turn, replicating authentic aircraft and starfighter dynamics.

Rotation integration uses a normalized delta quaternion:
$$\Delta q = \text{Normalize}\left( \begin{bmatrix} \vec{\omega} \cdot \Delta t \\ 1 \end{bmatrix} \right)$$
$$q_{\text{ship}}(t + \Delta t) = q_{\text{ship}}(t) \cdot \Delta q$$

### Camera Spring Damping:
The third-person camera trails behind the ship's engine nozzles:
$$\vec{P}_{\text{camTarget}} = \vec{P}_{\text{ship}} - \vec{F}_{\text{world}} \cdot d_{\text{chase}} + \vec{U}_{\text{world}} \cdot h_{\text{chase}}$$
$$\vec{P}_{\text{cam}}(t + \Delta t) = \text{Lerp}(\vec{P}_{\text{cam}}(t), \vec{P}_{\text{camTarget}}, 14.0 \cdot \Delta t)$$
$$\text{Camera.lookAt}(\vec{P}_{\text{ship}} + \vec{F}_{\text{world}} \cdot 30)$$

---

## 4. Procedural Asset Generation (Zero-Dependency Engine)

### Canvas Texture Generators (`src/3d/proceduralTextures.ts`):
All textures are rendered into memory canvases and wrapped into `THREE.CanvasTexture`:
1. **`createEarthLikeTexture()`**: Multi-frequency harmonic trigonometric blobs for continental landmasses, deep ocean depth gradients, mountain ridges, and polar ice caps.
2. **`createCloudsTexture()`**: Overlapping radial alpha gradients creating drifting cloud cover.
3. **`createDesertTexture()`**: Sinusoidal dune striations and rocky badland rings.
4. **`createIceTexture()`**: Reflective glacial plateaus with jagged, multi-segment crevasses.
5. **`createVolcanicTexture()`**: Obsidian crust crossed by glowing orange/red lava fissures with shadow blur bloom.
6. **`createGasGiantTexture()`**: Banded chromatic striations with an atmospheric Great Red Spot vortex.
7. **`createRingsTexture()`**: Radial alpha band strips incorporating the Cassini Division gap.
8. **`createHullPanelTexture()`**: Repeating structural plating seams and rivet markings applied as a bump map on ship hulls.

### Procedural Terrain Heightfield (`src/3d/surfaceEnvironment.ts`):
When landing on a planet, a `PlaneGeometry(600, 600, 90, 90)` has vertex elevations computed dynamically:
$$y(x, z) = \begin{cases} 
0 & \text{if } \sqrt{x^2 + z^2} < 35 \text{ (Landing Pad Zone)} \\
f_{\text{biome}}(x, z) \cdot \text{Blend}\left(\frac{\sqrt{x^2+z^2} - 35}{40}\right) & \text{otherwise}
\end{cases}$$
where $f_{\text{biome}}$ generates biome-specific topography (desert dunes, glacial canyons, or volcanic ridges).

---

## 5. Procedural Audio Synthesis Architecture

All sound effects and ambient soundtracks are synthesized via the native Web Audio API (`src/audio/SoundEngine.ts`):

```
AudioContext Destination
         ▲
         │
    MasterGainNode (0.0 - 1.0)
    ┌────┴───────────────────────────┐
    │                                │
SfxGainNode (0.0 - 1.0)      MusicGainNode (0.0 - 1.0)
    ▲                                ▲
    ├─ Engine Thruster Osc 1 & 2     └─ Evolving Modal Pad Oscillators
    ├─ Pink/Brown Noise Generator       (Filtered Lowpass Chords)
    ├─ Boost Ignition Sweep
    ├─ Polyphonic Crystal Chimes
    ├─ Atmosphere Entry Wind
    ├─ Quantum Warp Pulse
    └─ Sonar Scanner Ping
```

### Sound Synthesis Details:
- **Engine Rumble**: Two oscillators (Sawtooth 42–137 Hz + Sine 117–383 Hz) blended with pink-brown noise generated by an algorithmic white-noise filter:
  $$\text{output}[i] = \frac{\text{lastOut} + 0.02 \cdot \text{white}}{1.02}$$
- **Harmonic Crystal Chime**: Four simultaneous sine wave oscillators triggered in an arpeggiated sequence with exponential decay envelopes, tuned to musical frequencies corresponding to crystal rarity (e.g. C5, E5, G5, C6 for Quantum; E5, G#5, B5, E6 for Plasma).
- **Generative Ambient Music**: Runs continuously on a 6.8-second cycle, modulating between 5 space chords in D minor and F Lydian.

---

## 6. Economy, Progression & Upgrade Mathematics

### Upgrade Curves:
Upgrades scale from Level 1 to Level 5. The crystal cost for each level is linear:
$$\text{Cost}(\text{Level}) = \text{Level} \times 25 \text{ QC}$$

| Subsystem | Base Stat | Level Increment | Level 5 Maximum |
| :--- | :--- | :--- | :--- |
| **Engine Speed** | Ship Base ($75 - 95$) | $+18\text{ KTS}$ | $147 - 167\text{ KTS}$ |
| **Acceleration** | Ship Base ($40 - 55$) | $+12$ | $88 - 103$ |
| **Energy Capacity**| Ship Base ($100 - 180$) | $+20\text{ J}$ | $180 - 260\text{ J}$ |
| **Energy Recharge**| Ship Base ($4.5 - 7.0$) | $+2.0\text{ J/s}$ | $12.5 - 15.0\text{ J/s}$ |
| **Shield Strength**| Ship Base ($100 - 180$) | $+25\text{ HP}$ | $200 - 280\text{ HP}$ |
| **Maneuverability** | Ship Base ($1.1 - 1.4$) | $+0.3\text{x}$ | $2.3 - 2.6\text{x}$ |
| **Scanner Range** | Ship Base ($280 - 450$) | $+80\text{ U}$ | $600 - 770\text{ U}$ |

### Crystal Collection Proximity:
- **Collection Threshold**: $d \le 4.5\text{ units}$ (triggers immediate pickup).
- **Magnetic Pull Radius**: $d \le \text{ScannerRange} \times 0.25$. When within magnetic range, crystal velocity moves toward the ship:
  $$\vec{v}_{\text{crystal}} = \frac{\vec{P}_{\text{ship}} - \vec{P}_{\text{crystal}}}{\|\vec{P}_{\text{ship}} - \vec{P}_{\text{crystal}}\|} \cdot (38.0 \cdot \Delta t)$$

---

## 7. Input Subsystem & Cross-Platform Hardware Handling

### Input Sources:
1. **Desktop Keyboards**: Discrete key tracking on `keydown` and `keyup` without repeating event stalls.
2. **Pointer Lock & Mouse Drag**: Reads `e.movementX` and `e.movementY` scaled by user-configurable sensitivity and pitch invert settings.
3. **Gamepad API**: Polled on every frame using `navigator.getGamepads()`. Deadzone threshold ($0.15$) eliminates stick drift. Triggers map to analog throttle and reverse.
4. **Touchscreen Interface (`MobileControls.tsx`)**:
   - Left virtual thumb joystick computes normalized polar coordinates $(\cos\theta, \sin\theta)$ for pitch/yaw flight control.
   - Right discrete cruise selectors (`MAX`, `CRZ`, `CUT`, `REV`) and touch afterburner button.

---

## 8. Data Persistence, Multi-Slot Architecture & Checksums

Allifly uses a hardened, multi-slot save architecture with checksum verification and automatic snapshot backup recovery.

### Save Schema & Slot Layout:
- Supported slots: `slot1`, `slot2`, `slot3`, `autosave`.
- Checksum validation: Computed via a polynomial hash of core state variables (`version`, `slotId`, `credits`, `selectedShipId`, `missionsCompleted`, `crystalsCollected`, `discoveredPlanets`).
- Snapshot Backups: Every write creates an emergency backup copy (`allifly_backup_<slotId>`). If primary save data is corrupted or fails structural validation, the engine automatically restores from the backup snapshot without halting gameplay.
- Safe Checkpoints: Automatically tagged on Major Events:
  - `"Docked at Aegis Orbital Citadel"`
  - `"Departed Aegis Orbital Citadel"`
  - `"Landed on Terra Nova"`
  - `"Orbit Departure"`
  - `"Scanned Ancient Relic"`
  - `"Completed Mission: <Title>"`
- Export & Import: Saves can be exported as `.json` files and imported across any browser or device.

---

## 9. Complete Gameplay Loop & Orbital Station Citadel

1. **Docked at Space Station**: Player begins inside the `Aegis Orbital Citadel` Command Briefing room.
2. **Accept Contract**: Player chooses an exploration mission from the Mission Board.
3. **Launch Spaceship**: Undock sequence with thruster ignition audio deploys ship into planetary orbit.
4. **Space Flight & Navigation**: Follow waypoint indicator toward target planet or crystal field.
5. **Atmospheric Entry & Planetary Surface**: Approach landable planet (`Terra Nova`, `Solara Sands`, `Glacies Prime`, `Ignis Caldera`), enter atmosphere, and explore procedural heightfield terrain.
6. **Ancient Relics & Monoliths**: Discover and scan ancient glyph sites (`[F] Scan Relic`) for bonus crystal rewards and mission credit.
7. **Return to Station**: Fly within docking range of Aegis Orbital Citadel, dock (`[F]`), refuel energy capacitors, claim rewards, and purchase subsystem upgrades.
8. **Progression Unlocks**: Missions unlock new sectors, planets, and ship vessels (`Void Phoenix`, `Chrono Cruiser`).

---

## 10. Native Windows & Android Standalone Packaging

### Windows Standalone & Installer:
- **Instant Standalone (.zip)**: Includes `start-allifly.bat` and `install-desktop-shortcut.bat` for running immediately with zero web browser UI.
- **Electron Native Wrapper (`electron/main.cjs`)**:
  - Full hardware WebGL acceleration enabled (`--enable-webgl`, `--ignore-gpu-blocklist`, `--enable-gpu-rasterization`).
  - Borderless frameless window with F11 fullscreen toggle and custom taskbar icon.
  - Native Windows installer generation via `npm run pack` (`electron-builder`).

### Android Native APK & Google Play App Bundle (AAB):
- **Package ID**: `com.allifly.spaceexplorer`
- **Capacitor Configuration (`capacitor.config.json`)**: Configured for hardware-accelerated WebGL 2.0 with splash screen and fixed landscape orientation.
- **Automated Gradle Build Scripts**: `build-apk.sh` and `build-apk.bat` generate signed `app-release.apk` (sideloading) and `app-release.aab` (Google Play Store).
- **WebAPK Sideload**: One-click install from Chrome Android generates a dedicated OS package with custom launcher icon.
- **100% Offline Play**: Full service worker caching enables deep space exploration without internet connection.
