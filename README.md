# Off-Ramp Arcade

A games website with a dark theme, a home page listing every game, and tabs across the top for each genre. Everything is plain HTML, so any free static host works.

```
index.html                     home page: all games, genre tabs, search
play.html                      shared play page, opened as play.html?g=<slug>
interstate-weave.html          play page for Interstate Weave
games/<slug>/index.html        one folder per game
assets/games.js                the list of games (titles, genres, card art, how-to-play text)
assets/kit.js                  small helper the built-in games share (canvas, input, sound, high scores)
assets/style.css               site styles
assets/arcade.css              styles for the tabs, cards and shared play page
```

## Put it online with GitHub Pages (free)

1. Make an account at github.com.
2. Click **New repository** and name it `yourname.github.io` (use your real GitHub username). Make it **Public**.
3. On the repository page, click **Add file → Upload files**. Drag in everything from this folder, keeping the folder structure. Then click **Commit changes**.
4. Go to **Settings → Pages**. Under "Build and deployment", pick **Deploy from a branch**, then choose `main` and `/ (root)`, and click Save.
5. After about a minute, the site is live at `https://yourname.github.io`.

If you'd rather use a different repository name, like `arcade`, the address becomes `https://yourname.github.io/arcade/`.

## Even faster: Netlify Drop

Go to https://app.netlify.com/drop and drag this whole folder onto the page. You get a live link right away. Sign up for free to keep the site and change its name.

## Rename the site

Search for `Off-Ramp Arcade` and `EXIT 66` in `index.html`, `play.html` and `interstate-weave.html` and replace them with your own name.

## Add another game

1. Put the game in `games/<slug>/index.html`.
2. Add an entry for it to the `GAMES` list in `assets/games.js`. Give it a `genre` from the `GENRES` list at the top of that file and it shows up on the home page and under that genre's tab.

## Credits and licenses

Most games were written for this site. Two are open-source games included under their own licenses, with the license file kept in each folder:

- `games/2048/` is 2048 by Gabriele Cirulli (MIT License). Source: https://github.com/gabrielecirulli/2048
- `games/hextris/` is Hextris by Logan Engstrom, Garrett Finucane, Noah Moroze and Michael Yang (GNU GPL v3). Source: https://github.com/Hextris/hextris. Advertising and analytics scripts were removed and the share buttons are hidden.

Only add games you made or whose license allows them to be re-hosted, and keep their credit and license file.

## Note

The game loads its 3D engine (three.js) from a public CDN and falls back to a second CDN if the first one is blocked. It needs an internet connection the first time it loads.
