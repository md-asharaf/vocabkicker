# VocabKicker ⚽🧠

**A 3D penalty shootout game that tests your vocabulary skills. Curve the ball past the wrong goalkeepers and score goals by aiming for the correct definitions!**

Built with Three.js, this web-based mini-game turns learning vocabulary and mnemonics into an arcade penalty shootout. Read the definition, aim at the correct goalkeeper, curve your shot, and build your streak!

## Features

- **3D Physics & Gameplay**: Aim your shots, set your power, and add curve using interactive drag controls.
- **Multiple Goalkeepers**: 4 goalkeepers guard the net simultaneously. The wrong ones will dive to save your shot, while the correct one will miss it—if your aim is true!
- **Vocabulary Quiz Integration**: Dynamic question loading from JSON data. Learn new words with mnemonics while playing.
- **Responsive Design**: Works beautifully on both desktop and mobile devices, featuring a dynamic HUD and camera FOV scaling.
- **Audio & Visual Polish**: Includes goal nets, particle effects, crowd cheers, referee whistles, and dynamic UI feedback banners.

## Installation & Setup

1. Clone this repository to your local machine.
2. Install the required dependencies using npm:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` link in your browser to play the game!

## Tech Stack

- **Three.js**: 3D rendering, scene management, and character animations.
- **Vite**: Lightning-fast frontend build tool and dev server.
- **HTML/CSS/JS**: Vanilla frontend implementation for maximum performance without framework overhead.

## Adding Custom Words

You can easily modify the words and mnemonics by editing the `data.json` file in the root directory.

## Controls

- **Desktop**: Click and drag from the ball. Release to shoot. Drag left/right to curve the ball.
- **Mobile**: Touch and drag from the ball. Release to shoot.
