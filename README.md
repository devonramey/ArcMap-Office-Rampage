# ArcMap: Office Rampage

A **browser-based first-person shooter prototype** set on an office floor overrun by angry ArcMap gremlins. An unofficial entertainment parody, not affiliated with or endorsed by Esri.

## Play

**Game:** https://devonramey.github.io/ArcMap-Office-Rampage/

**Source:** https://github.com/devonramey/ArcMap-Office-Rampage

The game is entirely client-side and hosted as static files on GitHub Pages. It requires a desktop browser with hardware-accelerated WebGL. It has no login, tracking, backend, or external game server.

## Controls

| Key or input | Action |
| --- | --- |
| Arrow Up / Arrow Down | Move forward / backward |
| Arrow Left / Arrow Right | Strafe left / right |
| Mouse movement | Aim and look around |
| Left mouse | Fire |
| Right mouse hold / release | Grab a nearby office object / throw it |
| Right Shift | Sprint |
| Space | Jump |
| Delete or R | Reload |
| Enter or E | Open the door or take the exit elevator |
| Mouse wheel / number keys 1–4 | Change weapons |
| Escape | Pause and unlock the mouse |

Optional WASD movement and left Shift sprint are supported, but **arrow keys are the default layout**. Click **Deploy Into Office** to capture your mouse pointer.

## Prototype features (v0.1)

- Pregame loadout menu: **assault rifle**, **pump shotgun**, **SMG**, and **revolver**.
- One furnished office floor: cubicles, workstations, conference space, filing cabinets, computers, plants, glass partitions, server racks, and fluorescent ceiling lighting.
- **12 hostile ArcMap gremlins**, including runners, crawlers and one brute, with procedural faces and limbs.
- Mouse aim, firearm muzzle effects, spreading shotgun pellets, weapon recoil, hit-part damage modifiers, and responsive health/ammo indicators.
- AI office navigation, physics-inspired thrown objects, interactive door, minimap, combat objective, elevator exit, pause screen and mission results.
- Synthetic game audio; all meshes, lighting and textures are created in JavaScript.

**Scope:** This is an early playable prototype. Realistic visual polish, high-fidelity 3D ragdoll physics, precise navmesh AI, multiple floors, and production-quality audio are future enhancements, not features already completed.

## Technology and local testing

Three.js r160 is included under `vendor/three.module.js` with its original MIT license in `vendor/LICENSE-Three.txt`. Other files are standard HTML/CSS/JavaScript.

For local testing, download the **entire repository**, then serve it over HTTP from the folder:

```bash
python -m http.server 8000
```

Open http://localhost:8000/ . Opening `index.html` directly as a `file://` page can prevent browser JavaScript module loading.

The GitHub Actions workflow runs an automated Chrome gameplay smoke test. Browser test reports are saved to `tests/CI_RESULT.txt` and `tests/CI_BROWSER_OUTPUT.txt`.

## Trademark and licensing

Three.js is MIT-licensed, with copyright retained by its original authors. ArcMap, ArcGIS and Esri are trademarks of their owners. Their names and visual motifs are included solely for unofficial parody.
