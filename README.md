# GLEITS website

Vite + React site for GLEITS (PVT) LTD. Dark-first design built from the GLEITS logo colours.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build into dist/
npm run preview    # serve the build, forms still save to JSON
```

## Where things live

| What | Where |
| --- | --- |
| All copy (services, industries, projects, values…) | `src/data.js` |
| Design tokens, colours, layout | `src/styles.css` |
| Pages | `src/pages/` |
| Header, footer, shared bits | `src/components/` |
| Logo and images | `public/logos/`, `public/images/` |

## Form submissions

There is no separate backend. A small plugin in `vite.config.js` handles two endpoints and appends each
submission to a JSON file:

| Form | Endpoint | Saved to |
| --- | --- | --- |
| Contact (project enquiries) | `POST /api/enquiries` | `data/enquiries.json` |
| Careers (details only, no CV upload) | `POST /api/applications` | `data/applications.json` |

These files are created on the first submission and are git-ignored because they hold personal details.

The plugin runs inside Vite, so it works with `npm run dev` and `npm run preview`. A static host
(Netlify, Vercel static, GitHub Pages, cPanel) only serves `dist/` and has no server, so the forms will show
an error there. For that kind of hosting, point `submitForm()` in `src/components/shared.jsx` at a form service
(Formspree, Web3Forms, a Google Apps Script…) instead.

## Brand

- Ink `#05070D` · Surface `#0A0F1C` · Navy `#0F2B57` · Gleits Blue `#2A78DC` · Sky `#4CC3F5` · Graphite `#4B5159`
- Fonts: Sora (headlines), Inter (body), JetBrains Mono (labels)
- Motion respects `prefers-reduced-motion`.
