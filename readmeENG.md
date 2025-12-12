Missal Planner — English Version

A simple and minimalist application designed to organize liturgical songs for Mass and Eucharistic Adoration, and to display song lyrics during celebrations.

Overview

Missal Planner is a lightweight and practical tool created for liturgy teams, musicians, cantors, and missionaries who need to prepare celebrations quickly, clearly, and in an organized way.

Key Features

Create liturgical song lists

Edit and reorder songs

Save and reopen previous celebrations

Export clean sheets as PDF

Share lists through files or links

Display song lyrics with:

adjustable zoom

page navigation

movable and resizable text frame ("moldura")

multi-monitor support

fullscreen mode and bordered window mode

Clean, distraction-free interface

Project Structure
missal-planner/
├─ public/
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ data/
│  ├─ App.jsx
│  └─ ...
├─ electron/
│  ├─ main.cjs
│  ├─ preload.js
│  └─ ...
├─ package.json
└─ ...

How to Run
Requirements

Node.js 18+ (recommended: 20)

Install dependencies
npm install

Run development mode (web)
npm run dev


Open in browser:

http://localhost:5173

Run desktop mode (Electron)
npm run dev-electron

Roadmap

Planned features for upcoming versions:

JSON import

Advanced PDF export

Shareable links

Internal search

Filter by number and title

Sorting options

"Adoration Mode"

Built-in song editor

Modern UI based on Tailwind CSS

Contributing

Contributions are welcome.

For new ideas or feature requests: open an issue

For improvements or fixes: submit a pull request

Credits

Created by Marco Cadeddu.
Supported by the open-source community.

License

Released under the MIT License.