# 💰 MoneySaver

A clean, lightweight personal finance tracker that runs entirely in your browser — no sign-up, no server, no data leaving your device.

## Features

- **Track income & expenses** — add transactions with an amount, category, description, and date
- **Dashboard overview** — see your net balance, total income, and total expenses at a glance
- **Monthly bar chart** — visualise the last 6 months of income vs. expenses
- **Full transaction history** — filter by type, category, or month
- **Edit & delete** transactions at any time
- **Customisable categories** — add or remove income/expense categories
- **4 colour themes** — Light, Dark, Green, Blue
- **9 currency symbols** — $, €, £, ¥, ₹, ₩, R$, C$, A$
- **CSV export** — download all your data as a spreadsheet
- **Offline-first** — all data is stored in your browser's `localStorage`; nothing is sent anywhere

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern browser — that's it!

```bash
git clone https://github.com/ZeRy0X/MoneySaver-Release.git
cd MoneySaver-Release
open index.html   # macOS
# or just double-click index.html in your file manager
```

## Usage

| Action | How |
|--------|-----|
| Add a transaction | Click **+ Add Transaction** in the top bar |
| Edit a transaction | Hover over a row and click ✏️ |
| Delete a transaction | Hover over a row and click 🗑️ |
| Change theme / currency | Go to **Settings** |
| Add a custom category | Go to **Settings → Categories** |
| Export data | Go to **Settings → Data → Export CSV** |

## File Structure

```
MoneySaver-Release/
├── index.html   # App shell & markup
├── style.css    # All styles & themes
├── app.js       # App logic (state, rendering, events)
└── README.md
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript to be enabled.
