# Interstate Weave: launch checklist

Everything below is the part only you can do (it needs your Roblox account). The game code is ready.

## 1. Publish
1. Open `InterstateWeave.rbxlx` in Studio, then File > Publish to Roblox (new experience or your existing one).
2. Game Settings > Security: turn on **Enable Studio Access to API Services** (needed so progress saves).
3. Game Settings > Basic Info: name, description (below), genre Racing, device support: Computer, Phone, Tablet.

## 2. Create the passes (Creator Hub > your experience > Monetization > Passes)
After creating each, copy its id into `C.PASS_IDS` in `src/shared/Catalog.luau` (or edit the ModuleScript IWCatalog in Studio). Price shown is the suggestion in the code; the live price is whatever you set.

| Key | Name | Suggested R$ |
|---|---|---|
| `paint_shift` | Colour-shift paint | 149 |
| `paint_chrome` | Chrome paint | 249 |
| `wheels_gold` | Gold wheel set | 99 |
| `pack_livery` | Race livery pack | 129 |
| `pack_neon` | Neon night pack | 179 |
| `slots` | 3 extra build slots | 99 |
| `double` | Double points | 399 |
| `car_or2` | OR-2 (car) | 399 |
| `car_nova` | Nova (car) | 599 |
| `car_specter` | Specter (car) | 799 |
| `car_eclipse` | Eclipse (car) | 999 |
| `map_mesa` | Red Mesa (map) | 79 |
| `map_coast` | Sunset Coast (map) | 99 |
| `map_yuki` | Yuki Pass (map) | 129 |
| `map_neon` | Neon City (map) | 149 |
| `map_lunar` | Lunar Loop (map) | 199 |
| `rcrate_gold` | Gold crate | ? |
| `rcrate_diamond` | Diamond crate | ? |
| `rcrate_mythic` | Mythic crate | ? |

## 3. Create the 3 crate products (Monetization > Developer Products)
| Key | Name | Suggested R$ |
|---|---|---|
| `rcrate_gold` | Gold crate | 99 |
| `rcrate_diamond` | Diamond crate | 299 |
| `rcrate_mythic` | Mythic crate | 799 |

Paste ids into `C.PRODUCT_IDS`. These are paid random items: odds are already shown in the garage, and the server blocks players whose account has paid random items restricted.

## 4. Compliance
- Experience > Settings > Maturity & Compliance questionnaire: answer yes to **paid random items**.

## 5. Before going public
- In `parts/game.luau` set `TEST_UNLOCK_ALL = false` (it only unlocks things in Studio, but turn it off for the real test).
- Test with a second account: buy one pass, one crate, check progress is still there after rejoining.
- Test on a real phone (phone mode switches on automatically: shorter view, thinner scenery, no post-effects).
- Add an icon (512x512) and 3 to 5 screenshots.

## Game page description
Thread through four lanes of highway traffic. Pass within a metre of other cars for close calls and a points multiplier, rewind mistakes, and chain stunts. Six maps (Interstate 90, Red Mesa, Sunset Coast, Yuki Pass, Neon City, Lunar Loop), 19+ cars, a full garage with parts and builds, and crates with every chance shown. Gas, brake and steer on phones with on-screen buttons.
