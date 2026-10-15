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
| Delete or R | Unused (reloading removed) |
| Enter or E | Open the door or take the exit elevator |
| Mouse wheel / number keys 1–7 | Change weapons |
| Escape | Pause and unlock the mouse |

Optional WASD movement and left Shift sprint are supported, but **arrow keys are the default layout**. Click **Deploy Into Office** to capture your mouse pointer.

## Prototype features (v0.3)

- Pregame loadout menu: **assault rifle**, **semi-automatic shotgun**, **SMG**, **flamethrower**, **minigun**, **laser rifle**, and **heavy laser cannon**. The revolver has been removed.
- One furnished office floor: cubicles, workstations, conference space, filing cabinets, computers, plants, glass partitions, server racks, and fluorescent ceiling lighting.
- **12 hostile ArcMap gremlins**, including runners, crawlers and one brute, with procedural faces and limbs.
- Mouse aim, firearm muzzle effects, spreading shotgun pellets, weapon recoil, hit-part damage modifiers, and responsive health and infinite-ammo indicators.
- AI office navigation, physics-inspired thrown objects, interactive door, minimap, combat objective, elevator exit, pause screen and mission results.
- **Unlimited ammunition across all seven weapons. No magazines, reloads, ammo pickups, fuel limits or energy depletion.** Hold the mouse button for automatic weapons; click repeatedly for the semi-auto shotgun.
- Fire-based cone damage and burn-over-time, spinning six-barrel minigun, penetrating laser beams, and substantially stronger firearm damage.
- More detailed procedural first-person weapon models with barrel assemblies, rails, magazines, ammunition tanks, laser coils, sights, and hands.
- Improved office materials with procedural carpet texture, warmer fluorescent lighting, wall trim, signage and finer detailing.
- Synthetic game audio; all meshes, lighting and textures are created in JavaScript.

**Scope:** This remains an early browser prototype. The upgraded weapons and semi-realistic office are procedural geometry rather than photorealistic models. Full physically simulated enemy ragdolls, sophisticated navigation, additional floors, and professional audio remain future improvements.


## v0.3: projectile visuals and sound redesign

- True moving **3D bullet models** and bright traveling projectile streaks launched from the gun muzzle, with visible travel at rest, rather than 0.06-second stationary ray lines. Damage calculation remains immediate (hitscan) for responsive FPS gameplay.
- Rifle, SMG, shotgun and minigun eject visible physical-style shell casings. Bullet impacts emit round sparks instead of cubes.
- The flamethrower now renders overlapping semi-transparent flame and smoke sprites with expanding turbulence, near-muzzle light, and burning enemies. The old square flame particles are removed.
- Laser weapons produce glowing core-and-halo beams; the muzzle flash is a layered flare instead of a solid sphere.
- A new Web Audio sound system provides **distinct synthesized** sounds for each ballistic weapon, laser blasts, minigun rotary motor and a continuous flamethrower roar. The audio unlocks when clicking Start and should be heard if browser/device audio is enabled.
- These are generated game sounds. They are **not actual recordings of firearms**, and future audio releases could introduce CC0 actor/field recordings.
- Existing infinite ammunition, no reloads, arrow-key movement, mouse aim and object grabbing remain intact.
- Project modules: `weapon_visuals_v0_3.js` and `weapon_audio_v0_3.js`, both loaded as local ES modules, offline-capable with the rest of the repository.

### Level roadmap

- **v0.4 target:** 3 distinct playable floors, elevator transitions, different layouts and enemy encounters.
- **v0.5 target:** server room and records floor, new gremlin varieties.
- **v0.6 target:** executive floor, boss and campaign completion. These are planned additions and are **not implemented in v0.3**.

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
