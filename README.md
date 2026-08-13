<div align="center">
  <img width="350" height="auto" alt="UniDrive logo" src="https://github.com/user-attachments/assets/5a36f2eb-3906-434a-99c5-34190e4cfa67" />
</div>


# UniDrive

**Every Drive. One workspace.**

UniDrive is an self-hosted workspace that unifies multiple Google Drive accounts into a single interface. Connect every account you use, browse and search across all of them at once, and manage everything from one clean workspace — while your files stay exactly where they are.

🔗 Live demo: [unidrive.dharmik.live](https://unidrive.dharmik.live)

---

## Why UniDrive

Juggling multiple Google accounts usually means switching tabs, remembering which file lives where, and searching the same query five times. UniDrive removes that friction:

- **One workspace, every account** — view and manage files across all your connected Google Drive accounts in a single explorer.
- **Nothing is moved or duplicated** — UniDrive indexes your files; your data stays in its original account.
- **Open source and self-hostable** — run it on your own infrastructure, full transparency, no vendor lock-in.
- **Your data, your control** — credentials and access stay under your management, not a third party's.

---

## Features

- Unified file explorer across multiple Google Drive accounts
- Universal search across every connected account
- Combined storage and usage analytics
- Background sync to keep everything current
- Favorites, tags, and recent files
- Clean, keyboard-friendly interface

**Supported providers**

| Provider | Status |
|---|---|
| Google Drive | ✅ Available |
| Dropbox | 🔜 Planned |
| OneDrive | 🔜 Planned |
| Amazon S3 / Cloudflare R2 | 🔜 Planned |
| WebDAV / NAS | 🔜 Planned |

---

## Tech stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** (add your backend stack here, e.g. Node.js / FastAPI)
- **Auth:** Google OAuth
- **Icons:** Tabler Icons / react-icons

---

## Getting started

### Prerequisites
- Node.js 18.18 or later
- npm or yarn
- A Google Cloud project with the Drive API enabled and OAuth credentials

### Installation

```bash
git clone https://github.com/Dharmiksarvaiya24/UniDrive.git
cd UniDrive
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Run locally

```bash
npm run dev
```

Then open `http://localhost:3000` (or the port shown in your terminal).

---

## Project structure

```
UniDrive/
├── src/
│   ├── assets/          # images, icons, logos
│   ├── components/
│   │   ├── common/      # shared, reusable components
│   │   ├── layout/      # navbar, footer, page wrappers
│   │   └── ui/          # small presentational primitives
│   ├── sections/        # full page sections (Hero, Features, etc.)
│   ├── hooks/           # custom React hooks
│   ├── lib/              # utilities, API calls, helpers
│   ├── animations/       # Framer Motion variants
│   ├── styles/            # global CSS, Tailwind config
│   ├── data/               # static content, constants
│   └── types/               # TypeScript types/interfaces
├── public/
├── rules.md              # development rules for contributors and AI agents
├── code-standards-js.md  # code style guide
└── README.md
```

---

## Roadmap

- [x] Google Drive integration
- [ ] Multi-account support within Google Drive
- [ ] Dropbox and OneDrive integration
- [ ] S3-compatible storage support
- [ ] Desktop and mobile apps
- [ ] Plugin marketplace for community-built providers


---

## Author

Built by [Dharmik Sarvaiya](https://dharmik.live) · [GitHub](https://github.com/Dharmiksarvaiya24)
