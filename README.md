# Taanshu Babariya — Portfolio

A one-page personal portfolio: dark, cinematic, one signal-red accent. It is a **static website** (plain
HTML, CSS and a little JavaScript, no server, no database) built with [Astro](https://astro.build) and
hosted on [Netlify](https://www.netlify.com). The code lives on GitHub; every time you push a change there,
Netlify rebuilds and republishes the site by itself.

This guide assumes you have **never deployed a website before**. Read the first three sections once; after
that you will mostly need the "Change something" and "Publish a change" sections.

---

## 1. The big picture (in plain words)

```
 your computer ──git push──▶ GitHub (stores the code) ──auto──▶ Netlify (builds + hosts) ──▶ the live website
```

* **Your computer** is where you edit and preview.
* **GitHub** is a safe copy of your project, with history of every change.
* **Netlify** watches the GitHub project. When something new arrives, it runs `npm run build` (which turns
  the project into the finished website in a folder called `dist`) and puts it online.
* You never upload files by hand. **`git push` is the "publish" button.**

Words you will see:

| Word | Meaning |
| --- | --- |
| **repo** (repository) | The project folder plus its history, stored on GitHub |
| **commit** | A saved snapshot of your changes, with a short note ("updated projects") |
| **push** | Send your new commits from your computer to GitHub |
| **build** | Turn the project into the finished website (`npm run build`) |
| **deploy** | Netlify putting a finished build online |

---

## 2. What is in this folder

You only ever need to touch the items marked **EDIT THIS**.

```
Portfolio/
├── src/
│   ├── data/
│   │   └── content.json         ← EDIT THIS: all your words, projects, skills and links
│   ├── assets/                  ← EDIT THIS: put your photo here as photo.jpg (see "Your photo")
│   ├── components/              ← the page sections (Hero, About, Deployments …)
│   ├── styles/                  ← the look: colours, type, layout
│   ├── scripts/                 ← the motion: smooth scroll, reveals, cursor, clock
│   ├── layouts/Base.astro       ← the <head>: title, SEO, link-preview tags
│   └── pages/                   ← index (the site), thanks (after the form), 404
├── public/
│   ├── Taanshu-Babariya-Resume.pdf   ← EDIT THIS: the résumé people download (replace the file)
│   ├── og.png, favicon.*, apple-touch-icon.png   ← link-preview image + icons (made by `npm run og`)
│   └── robots.txt               ← tells search engines where the sitemap is
├── scripts/make-og.mjs          ← generates the link-preview image and icons
├── netlify.toml                 ← tells Netlify how to build (you never need to type this in its dashboard)
├── astro.config.mjs             ← site settings (reads the address from content.json)
└── package.json                 ← the project's list of tools and commands
```

Two more folders exist **only on your computer** and are never uploaded (they are listed in `.gitignore`):
`legacy-static/` (the first, plain-HTML version of the site) and `reference/` (the inspiration videos and
your original résumé/CV). They are not part of the website.

---

## 3. Run the site on your computer

You need **Node.js 22 or newer** ([nodejs.org](https://nodejs.org), pick "LTS"). Check with:

```powershell
node -v
```

Then, inside the project folder (open it in a terminal — in VS Code: Terminal → New Terminal):

```powershell
npm install        # first time only: downloads the tools (takes a minute)
npm run dev        # starts the site on your computer
```

Open **http://localhost:4321** in your browser. Leave the terminal running; every time you save a file the
page updates by itself. Press **Ctrl + C** in the terminal to stop it.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Live preview while you edit (also shows items marked `"draft": true`) |
| `npm run build` | Builds the real website into `dist/` (what Netlify runs) |
| `npm run preview` | Serves the finished build from `dist/`, exactly as visitors get it |
| `npm run og` | Re-makes the link-preview image and favicons (see "Change the site address") |

---

## 4. Change something (the one file)

Open **`src/data/content.json`**. Everything visitors read is in there. The same instructions are at the
top of the file, in the `_howToEdit` list.

Rules that keep it working:

1. Change only the words **between the quotation marks**. Keep every quote mark, comma, bracket and brace
   where it is. (A missing comma is the #1 reason a build fails. If something breaks, paste the file into
   [jsonlint.com](https://jsonlint.com) and it shows the exact line.)
2. Put a word in `*single stars*` to make it stand out in red, or `**double stars**` for bold:
   `"I build *systems*"`.
3. **Add a project:** copy one whole `{ ... }` block inside `"projects"`, paste it right after another block,
   put a comma between the two blocks, then edit the words.
4. **Hide something without deleting it:** add `"draft": true` to that block. Drafts appear (with a red tag)
   on your computer when you run `npm run dev`, but never on the live site. Remove the line to publish it.
   (The SmartAds project is currently a draft, waiting for its details.)
5. Skills in the scrolling bands and in the Systems Matrix are plain lists. Add or remove names freely.

Where things are inside `content.json`:

| Block | What it controls |
| --- | --- |
| `site` | Page title, search description, link-preview text, the site address |
| `person` | Name, email, GitHub/LinkedIn links, résumé file name, location |
| `hero` | The first screen: tagline and the three tags |
| `ticker` | The scrolling skills band |
| `about` | Section 01: story, principles, timeline |
| `projects` | Section 02: the flagship project cards (and their numbers) |
| `archive` | Section 02's list of smaller projects |
| `matrix` | Section 03: skills grouped by area |
| `signals` | Section 04: training, research, coursework |
| `contact` | Section 05: headline, form labels and messages |

After editing, look at the result in `npm run dev`, then publish (section 6).

### Your photo

Save a portrait as **`src/assets/photo.jpg`** (`.png` or `.webp` also work). It is picked up automatically and
shown in the hero. Until then, a dark silhouette is shown. Portrait orientation (taller than wide) looks best.
Also update `"photoAlt"` in `content.json` if you want a different description for screen readers.

### Your résumé

Replace **`public/Taanshu-Babariya-Resume.pdf`** with the new file **using the same file name**. Both the hero
and the contact section link to it.

> **Everything inside `public/` is public.** Anyone can download the PDF. Before you publish, open it and
> check that it only contains details you are happy to share (for example your phone number).

### Colours, fonts, layout

The colours are at the top of `src/styles/base.css` (`--ink` is the black, `--paper` the off-white,
`--signal` the one red). Change a value there and the whole site follows. Fonts are bundled with the site
(Anton, Schibsted Grotesk, IBM Plex Mono), so there are no external font requests.

---

## 5. First-time deployment (GitHub, then Netlify)

You only do this once. Netlify's buttons get renamed from time to time, so if a label differs slightly, look
for the closest match.

### 5a. Put the code on GitHub

1. On github.com click **+ → New repository**, name it `portfolio`, leave "Add a README" **unticked**, click
   **Create repository**. (Yours is `https://github.com/ImGhost7/portfolio`.)
2. In the project folder, in a terminal:

```powershell
git init -b main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/ImGhost7/portfolio.git
git push -u origin main
```

The first `git push` opens a browser window asking you to sign in to GitHub. Sign in and click **Authorize**.
Your password is typed into GitHub's own page, never into the terminal.

### 5b. Connect Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and sign up with your GitHub account (the free plan is enough).
2. **Add new project → Import an existing project → Deploy with GitHub.** Allow Netlify to see the `portfolio`
   repository when GitHub asks.
3. Pick `ImGhost7/portfolio`. The build settings fill themselves in from `netlify.toml`
   (**Build command** `npm run build`, **Publish directory** `dist`). Click **Deploy**.
4. After about a minute you get a live address like `https://yourname.netlify.app`.
5. **New projects start private.** Only you, signed in to Netlify, can see them; everyone else gets a Netlify
   login page (error 401). To open the site to everyone: open the project → **Project configuration → General →
   Visitor access → Project visibility**, set **production deploys** to **Public** and click **Save**. (Once the
   first deploy has succeeded there is also a **Make public** button on the project page.) Check it by opening
   the address in a private/incognito window: you should see the site, not a login page.
6. A small **"Powered by Netlify" badge** may appear on public free-plan projects created after August 2026.
   You can switch it off under **Project configuration → General → Powered by Netlify badge**.
7. **Project configuration → Change project name** lets you choose the name (that name becomes the address).
   If you change it, follow "Change the site address" below so search engines and link previews use the new one.
8. Contact form: open **Forms** in the project menu. If it says form detection is off, click **Enable form
   detection**, then run a new deploy (**Deploys → Trigger deploy**). The `contact` form appears after that deploy.

From now on, every `git push` redeploys automatically.

---

## 6. Publish a change

After editing and checking it in `npm run dev`:

```powershell
git add .
git commit -m "Update projects"
git push
```

* `git add .` — "include all my changes"
* `git commit -m "…"` — "save a snapshot; this is the note describing it" (write anything short and clear)
* `git push` — "send it to GitHub" (Netlify notices and rebuilds)

Watch it happen in Netlify → your project → **Deploys**. A green **Published** means it is live (about a
minute). Hard-refresh the page (**Ctrl + F5**) if your browser still shows the old version.

If the deploy shows **Failed**, click it and read the log at the bottom; it names the file and line. The most
common cause is a missing comma or quote in `content.json`. Fix it, then commit and push again. A failed
deploy never takes the live site down: the previous version stays online.

---

## 7. The contact form

The form on the page is a [Netlify Form](https://docs.netlify.com/forms/setup/): there is no server of your own.

* People fill in name, email and message. A hidden "honeypot" field catches most spam bots.
* Messages arrive in Netlify → your project → **Forms** → **contact**.
* To get an email for each message: **Forms → Form notifications → Add notification → Email notification**,
  choose the `contact` form and enter your address.
* The form is detected when the site is built, so the **Forms** page only shows `contact` after a deploy has
  finished. The free plan has a monthly limit on submissions; see Netlify's pricing page.
* Test it once after deploying: send yourself a message, then check **Forms**.
* If a visitor has JavaScript switched off, the form still works and lands on a "Message received" page.

---

## 8. Change the site address (rename it, or add a custom domain)

The address is stored in three places. Update all three, then publish (section 6):

1. **`src/data/content.json`** → `"site"` → `"url"` (for example `"https://taanshu.dev"`).
   Page addresses, the sitemap and link previews all read from here.
2. **`public/robots.txt`** → the `Sitemap:` line.
3. Run **`npm run og`** to redraw the link-preview image (it prints the address in the corner), then commit
   the changed files in `public/`.

**A custom domain** (for example `yourname.com`) is bought from a domain seller, which **costs money** (roughly ₹1,000
or more per year, depending on the ending: .com, .dev, .in …). When you have one: Netlify → your project → **Domain management →
Add a domain**, and follow the on-screen DNS instructions at the place you bought it. Netlify then issues the
HTTPS padlock for free. DNS changes can take from a few minutes to a day.

---

## 9. Quality checks

The site was built to score **90+ in all four Lighthouse categories** (Performance, Accessibility, Best
Practices, SEO). To check it yourself: open the live site in Chrome, press **F12 → Lighthouse tab → Analyze
page load** (use a private window so extensions do not skew the numbers). Scores vary a little from run to run.

Built in on purpose:

* Respects the operating system's "reduce motion" setting, plus an on-page **motion: on/off** switch (bottom
  right). With motion off, nothing animates and every section is simply there.
* Works with the keyboard (visible focus rings, "Skip to content" link) and with screen readers
  (descriptive labels, alt text, proper headings).
* The custom cursor only appears on devices with a mouse. Touch screens get a layout designed for phones.
* Sections below the first screen are drawn lazily so the first load is quick. If you add or remove a *lot*
  of content in a section, you can refresh the size estimates at the bottom of `src/styles/extra.css`
  (the `--cv-…` values). Ignoring them only affects the scrollbar before the first scroll.

---

## 10. Troubleshooting

| Problem | What to do |
| --- | --- |
| `npm` or `node` "is not recognized" | Install Node.js (section 3), then **close and reopen** the terminal |
| `npm run dev` says the port is busy | A previous preview is still running. Close that terminal, or press Ctrl + C in it |
| Build fails right after you edited `content.json` | A missing comma or quote. Check the file at jsonlint.com |
| The live site still shows old text | Wait for **Published** in Netlify → Deploys, then hard-refresh (Ctrl + F5) |
| A project does not show on the live site | It has `"draft": true`. Remove that line, commit, push |
| **Forms** in Netlify shows nothing | Deploy once after the form exists, then reload the page. Submit a test message |
| `git push` asks who you are or is rejected | Make sure you are signed in to GitHub (a browser window opens the first time) |
| The live site asks for a Netlify login (error 401) | The project is still private. Make it public (section 5b, step 5) |
| `fatal: not a git repository` | You are in the wrong folder. `cd` into the `Portfolio` folder first |

If something is not covered here, the Netlify deploy log (Deploys → the failed deploy) almost always says
exactly what went wrong.
