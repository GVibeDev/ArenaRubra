# Arena Rubra — GitHub Pages deployment patch

This patch does not alter Arena Rubra gameplay code.

It adds a GitHub Actions workflow that publishes only the browser runtime required by the current root `index.html`:

- `index.html`
- `assets/`
- `css/`
- `data/`
- `src/`

Repository-only material such as tests, docs and IDE metadata is not copied into the Pages artifact.

Expected public URL on GitHub.com:

`https://gvibedev.github.io/ArenaRubra/`

## Important first-time step

Before expecting the deployment job to succeed, open the ArenaRubra repository on GitHub and set:

`Settings → Pages → Build and deployment → Source → GitHub Actions`

A first deployment attempted before Pages is enabled can fail with a Pages deployment 404, as happened during the initial GVibeDev.cc setup.
