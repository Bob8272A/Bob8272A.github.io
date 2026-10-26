# Off-Ramp Arcade

A small games website with Interstate Weave on it. Everything is plain HTML, so any free static host works.

```
index.html                     home page with the game grid
interstate-weave.html          play page (game window, fullscreen button, controls)
games/interstate-weave/        the game itself
assets/style.css               site styles
assets/interstate-weave.svg    game thumbnail
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

Search for `Off-Ramp Arcade` and `EXIT 66` in `index.html` and `interstate-weave.html` and replace them with your own name.

## Add another game

1. Put the game in `games/<slug>/index.html`.
2. Copy `interstate-weave.html` to `<slug>.html` and change the title, text, and the two `games/interstate-weave/index.html` paths.
3. Add a line to the `GAMES` list near the bottom of `index.html`, and remove one of the "Coming soon" entries.

## Note

The game loads its 3D engine (three.js) from a public CDN and falls back to a second CDN if the first one is blocked. It needs an internet connection the first time it loads.
