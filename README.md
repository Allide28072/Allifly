# ALLIFLY — 3D Space Explorer Odyssey

> **A Complete, High-Performance 3D Space Exploration & Planetary Adventure Game built with Three.js, React, TypeScript, and Web Audio API.**

---

## 🚀 Overview

**Allifly** is an immersive 3D space adventure where players pilot advanced spacecraft through an open procedural solar sector. Explore uncharted alien worlds, enter turbulent planetary atmospheres, touch down on planetary surface biomes, collect high-energy quantum crystals, dock with orbital stations, engage quantum hyperjumps, complete galactic missions, and upgrade ship subsystems in the engineering hangar.

Allifly is engineered with **zero external asset dependencies**: all 3D geometries, materials, planetary surfaces, celestial atmospheres, normal maps, and audio effects are generated procedurally in code with 60fps WebGL rendering. It runs seamlessly in desktop browsers, on mobile touchscreen devices, and as an installable standalone application on **Windows Desktop** and **Android Mobile** via Progressive Web App (PWA) standards.

---

## 🎮 Core Game Systems

### 1. Spaceship Fleet & Flight Mechanics
- **Orientation & Aerodynamics**: Ships are aligned facing forward along `-Z` (Three.js aerospace standard), with thruster exhausts and dynamic plasma flame particles trailing along `+Z`.
- **6-Degrees-of-Freedom (6DOF) Flight Model**:
  - Smooth exponential acceleration, inertia dampening, and cruise throttle control.
  - Natural banking roll physics: steering left or right with keyboard, mouse, or virtual flight stick automatically banks the ship into the turn.
  - Standard flight pitch kinematics: pulling back climbs, pushing forward dives.
  - Afterburner boost system consuming capacitor energy with dynamic camera FOV expansion (65° to 75°).
  - High-speed space dust particle stream streaming past the hull for tactile forward velocity feedback.

#### Spaceship Specs:
| Ship | Designation | Class | Max Speed | Acceleration | Agility | Energy | Shield | Scanner | Price |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Allifly Starwing** | AF-01 | Explorer Flagship | 85 KTS | 45 | 1.4x | 100 J | 100 HP | 280 U | Free (Starter) |
| **Void Phoenix** | VP-99 | Heavy Interceptor | 75 KTS | 55 | 1.1x | 120 J | 180 HP | 320 U | 150 QC |
| **Chrono Cruiser** | CC-Echo | Quantum Explorer | 95 KTS | 40 | 1.25x | 180 J | 130 HP | 450 U | 350 QC |

---

### 2. Celestial Universe & Planetary Exploration
The Allifly Sector features a central star (*Helios Core*), six distinct planetary worlds, orbital moons, space stations, and an asteroid field:

1. **Terra Nova** (`earth` class):
   - Blue liquid oceans, green continents, polar ice caps, rotating atmospheric clouds, and glowing cyan haze.
   - Surface exploration: Green rolling hills, mountain ridges, landing beacon pad, and quantum crystal clusters.
2. **Solara Sands** (`desert` class):
   - Golden sand dunes, rocky badlands, silicate dust rings, and solar wind storms.
3. **Glacies-IX** (`ice` class):
   - Crystalline glaciers, deep blue crevasses, sub-surface oceans, and frozen dark matter deposits.
4. **Ignis Prime** (`volcanic` class):
   - Obsidian crust, active magma calderas, glowing thermal lava fissures, and ember updrafts.
5. **Xenon Zenith** (`alien` class):
   - Bioluminescent purple terrain, exotic flora, alien crystalline spires, and high-purity quantum crystal pods.
6. **Chronos** (`gasGiant` class):
   - Massive banded gas titan with an atmospheric storm eye, massive multi-tier ring system, and 3 orbital moons. High gravitational shear prevents surface landing.

#### Orbital Space Stations:
- **Aegis Orbital Research Hub**: Multi-spoke citadel with a rotating toroidal habitat ring, solar arrays, and ship recharge/repair docks.
- **Hyperion Haven Outpost**: Deep-space mining and communications outpost monitoring the gas rings of Chronos.

---

### 3. Planetary Surface Mode
- Approaching within orbital range of any landable planet displays the contextual **[F] Land on Planet** prompt.
- Atmospheric entry activates aerodynamic heating whoosh sound effects.
- Lands on a 3D procedural terrain heightfield tailored to the planet's biome with a lit landing pad, perimeter approach beacons, surface crystals, alien structures, and a **[F] Blast Off** launch trigger returning to orbit.

---

### 4. Energy Economy & Crystal Harvesting
Energy crystals bob and rotate in space and on planetary surfaces. When player ships fly within magnetic attraction range, crystals are pulled toward the ship:
- 🔷 **Quantum Crystal (Cyan)**: Common crystal. Yields `+10 Energy` and `+5 QC Credits`.
- 🟣 **Plasma Crystal (Violet)**: Rare high-energy crystal. Yields `+25 Energy` and `+15 QC Credits`.
- 🟡 **Dark Matter Crystal (Amber)**: Ultra-rare exotic crystal. Yields `+50 Energy` and `+35 QC Credits`.

---

### 5. Galactic Missions System
Trackable through the in-game HUD and Mission Log terminal (`[L]` or `[Tab]`):
1. **Quantum Harvester**: Collect 8 Energy Crystals in deep space (`+60 QC`, `+50 En`).
2. **Planetary Touchdown**: Enter atmosphere and land on Terra Nova (`+85 QC`, `+75 En`).
3. **Emergency Power for Aegis Hub**: Deliver emergency power cells to Aegis Orbital (`+100 QC`, `+100 En`).
4. **Solar Dune Cartography**: Scan the silicate ring systems of Solara Sands (`+120 QC`, `+60 En`).
5. **Cryo-Glacial Recovery**: Land on Glacies-IX to recover dark matter clusters (`+150 QC`, `+80 En`).
6. **Volcanic Core Proximity Run**: Perform high-orbit scan of Ignis Prime calderas (`+175 QC`, `+90 En`).
7. **Chronos Gas Titan Beacon**: Make deep-space flight to Hyperion Outpost near Chronos (`+220 QC`, `+100 En`).

---

### 6. Spaceship Hangar & Upgrades
Visit the Hangar from the main menu, pause menu, or in-flight drawer to inspect ships on a 3D turntable and upgrade 7 key subsystems from Level 1 to 5:
- **Ion Thruster Velocitor**: Increases top sub-light and boost cruise speed.
- **Inertial Accelerator Coil**: Shortens time to reach maximum velocity.
- **Quantum Battery Matrix**: Expands total capacitor energy capacity.
- **Photonic Solar Converter**: Increases passive energy recharge rate.
- **Deflector Shield Hardener**: Boosts max shield durability against impacts.
- **Vector Thruster Gimbal**: Sharpens pitch, yaw, and banking turn agility.
- **Deep Radar Sensor Array**: Extends scanner and magnetic crystal collection range.

---

### 7. Controls & User Input

#### Desktop (Keyboard & Mouse):
| Action | Key / Input |
| :--- | :--- |
| **Accelerate / Cruise** | <kbd>W</kbd> |
| **Brake / Reverse** | <kbd>S</kbd> |
| **Yaw / Turn Left & Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> |
| **Pitch Nose Up / Down** | <kbd>↓</kbd> (Climb) / <kbd>↑</kbd> (Dive) or Mouse Drag |
| **Roll Wings** | <kbd>Q</kbd> / <kbd>E</kbd> |
| **Afterburner Boost** | <kbd>Spacebar</kbd> |
| **Radar Scanner Pulse** | <kbd>Shift</kbd> |
| **Contextual Interact (Land / Dock / Blast Off)** | <kbd>F</kbd> |
| **Galaxy Star Map** | <kbd>M</kbd> |
| **Mission Log** | <kbd>L</kbd> or <kbd>Tab</kbd> |
| **Switch Camera (3rd Person / Cockpit)** | <kbd>C</kbd> |
| **Toggle Minimal HUD / Cinema Mode** | <kbd>H</kbd> |
| **Pause Simulation** | <kbd>Esc</kbd> or <kbd>P</kbd> |

#### Gamepad / Controller:
- **Left Stick**: Pitch, roll, and steering.
- **Right Stick**: Yaw and camera look.
- **Right Trigger (RT / R2)**: Throttle acceleration.
- **Left Trigger (LT / L2)**: Brake / reverse.
- **Button A (Cross)**: Afterburner Boost.
- **Button X / Square**: Contextual Interact / Dock / Land.
- **Button Y / Triangle**: Galaxy Map.

#### Mobile Touchscreen HUD:
- **Virtual Flight Stick (Left)**: Smooth thumb joystick for 360° pitch and yaw steering.
- **Throttle Selector (Right)**: Discrete `MAX`, `CRZ`, `CUT`, and `REV` cruise controls.
- **Boost Button**: Hold for high-velocity plasma afterburners.
- **Action Buttons**: Floating quick-access icons for Radar Scanner, Camera Toggle, Galaxy Map, and Contextual Land/Dock.

---

### 8. Contextual UI / Low-Occlusion Design
- **98%+ Unobstructed Playfield**: Bulky cards and opaque panels have been removed from the active viewport.
- **Top Status Strip**: Minimal translucent pill showing velocity in knots, micro line gauges for energy and deflector shield, crystal credit counter, and 1-line active objective badge.
- **Rise to Interact**: Action prompts gently appear **only** when within proximity of a landable planet (`[F] Land on Planet`), a space station (`[F] Dock with Station`), or planetary launch pad (`[F] Blast Off`).
- **Cinema / Zen Mode**: Pressing <kbd>H</kbd> toggles 100% borderless, HUD-free cinematic space flight.

---

### 9. Procedural Web Audio Engine
No external `.mp3` or `.wav` assets are downloaded; all audio is synthesized directly via the HTML5 Web Audio API:
- **Dual-Oscillator Engine Hum**: Pitched sawtooth sub-oscillator + harmonic ion sine wave + filtered brown noise rush, modulated in real-time by throttle and boost.
- **Afterburner Boost Ignition**: Exponential frequency ramp with bandpass resonance.
- **Crystalline Harmonizer**: Polyphonic shimmering chords (D min, C maj, G# dim) tuned to crystal rarity.
- **Atmospheric Entry Wind**: Multi-stage lowpass filtered noise swell with rising resonance.
- **Quantum Hyperjump Pulse**: High-to-low acoustic glide with sub-bass thump.
- **Sonar Radar Ping**: Pure sine sweep for scanning planetary sectors.
- **Generative Cosmic Ambient Music**: Evolving ethereal synthesizer pads cycling through modal space chord progressions (D min9, Bb maj7, G sus2, A min7, F maj9).
- **Independent Volume Controls**: Separate sliders for Master, SFX, and Music + instant mute toggle.

---

### 10. Save & Persistence System
- Automatic persistence to `localStorage` under `allifly_space_explorer_save_v1`.
- Saves: Selected ship, unlocked ship fleet, 7 upgrade module levels, refined quantum credits, discovered planets, mission completion statuses, audio settings, and flight sensitivity.
- Options for **Continue Odyssey**, **New Game**, and **Reset Progress**.

---

## 💻 Tech Stack & Architecture

```
allifly/
├── public/
│   ├── icon.svg             # Vector brand icon (512x512)
│   └── manifest.json        # PWA Web App Manifest (standalone/landscape)
├── src/
│   ├── 3d/
│   │   ├── SpaceScene.ts          # Primary Three.js simulation, 6DOF kinematics & camera loop
│   │   ├── shipModels.ts          # Multi-part 3D procedural spaceships (Starwing, Phoenix, Cruiser)
│   │   ├── celestialModels.ts     # Planets, atmospheres, rings, moons, stations, crystals, stars
│   │   ├── surfaceEnvironment.ts  # Planetary surface terrain, heightfield & landing pads
│   │   └── proceduralTextures.ts  # 2D canvas procedural albedo, cloud, and normal textures
│   ├── audio/
│   │   └── SoundEngine.ts         # Procedural Web Audio API sound synthesis engine
│   ├── components/
│   │   ├── TitleScreen.tsx        # Cinematic hero ship centerpiece & launch UI
│   │   ├── HUD.tsx                # Low-occlusion flight status bar & rise-to-interact prompts
│   │   ├── MobileControls.tsx     # Virtual analog flight stick & touch throttle
│   │   ├── GalaxyMapModal.tsx     # Tactical 2D/3D orbital radar star chart & hyperjump
│   │   ├── HangarModal.tsx        # 3D spaceship turntable inspection & upgrade terminal
│   │   ├── MissionLogModal.tsx    # Full mission tracker with rewards & filters
│   │   ├── SettingsModal.tsx      # Graphics presets, audio calibration & control sensitivity
│   │   ├── PauseMenu.tsx          # Quick resume, manual save & navigation
│   │   └── InstallGuideModal.tsx  # Windows Desktop & Android Mobile installation guide
│   ├── game/
│   │   ├── missions.ts            # Mission objectives, types & rewards
│   │   ├── planetsData.ts         # Planetary coordinates, radii, atmospheres & biomes
│   │   ├── shipsData.ts           # Spacecraft performance parameters & pricing
│   │   └── storage.ts             # LocalStorage save/load state manager
│   ├── hooks/
│   │   └── usePWAInstall.ts       # PWA prompt hook with iOS/Android/Desktop detection
│   ├── types/
│   │   └── game.ts                # TypeScript interfaces for all game entities
│   ├── App.tsx                    # Top-level React coordinator & input manager
│   ├── main.tsx                   # React 19 entry point
│   └── index.css                  # Tailwind CSS v4 & custom scrollbar reset
├── index.html                     # HTML5 entry point with PWA meta tags & title
├── metadata.json                  # AI Studio applet capabilities & metadata
├── package.json                   # Dependencies & npm scripts
├── tsconfig.json                  # TypeScript bundler configuration
└── vite.config.ts                 # Vite 8 build pipeline with Tailwind CSS plugin
```

---

## 📦 Installation & Standalone App Setup

### Windows Desktop Application
1. Open the game in **Google Chrome** or **Microsoft Edge**.
2. Click the **Install App** button on the Title Screen or the Install icon in the browser address bar.
3. Windows installs **Allifly** directly onto your PC with:
   - A desktop shortcut icon.
   - Start Menu entry.
   - Borderless standalone window running at full 60fps with hardware WebGL acceleration.
   - Full offline support with keyboard, mouse, and game controller integration.

### Android Mobile Application
1. Open the game in **Chrome for Android**.
2. Tap **Install App** or select the browser menu (⋮) → **Add to Home screen** / **Install app**.
3. Allifly installs as a standalone Android app with the package identifier `com.allifly.spaceexplorer`.
4. Launches in landscape orientation with dedicated touchscreen flight controls and offline gameplay.

---

## 🛠️ Development & Build Commands

```bash
# Start local development server on port 3000
npm run dev

# Run TypeScript compiler check
npm run lint

# Build production bundle to /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
SPDX-License-Identifier: Apache-2.0
