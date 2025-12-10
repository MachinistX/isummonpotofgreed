# I Summon Pot of Greed! 🎴

A comprehensive Yu-Gi-Oh! deck analysis and combo simulator built with React + Vite.

## Features

### 🃏 Deck Builder
- Interactive card search using YGOProDeck API
- Drag & drop deck management (Main, Extra, Side deck)
- Real-time deck statistics and ratios
- Import/Export .ydk files

### 🎯 Combo Builder
- Define combo requirements with OR logic (Input Groups)
- Specify resulting board states (Outputs)
- **Vulnerability Analysis**: Define threats and protective answers
- **Brick Detection**: Mark "Garnet" cards that ruin combos
- Combo validation against current deck
- Import/Export combo definitions (JSON)

### 🎲 Hand Simulator
- Draw and analyze 5-card opening hands
- Automatic combo detection
- Dead card identification (duplicate HOPTs)
- Hand trap detection (PSCT-based)
- Vulnerability checking (threat/answer analysis)
- Visual indicators for:
  - Dead cards (Duplicate HOPT)
  - Hand traps (HT pill)
  - Garnets (GAR pill)
  - Bricked combos

### 📊 Batch Simulation (10,000 iterations)
- **Score Cards**:
  - Average playable hand size
  - Playable hand percentage
  - "Gas" percentage (all cards playable)
  - Average combo options
- **Vulnerability Ranking**: Top 4 most common threats
- **Combo Probability Table**: Success rates and brick percentages

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: YGOProDeck API

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features in Detail

### Hand Trap Detection
Uses PSCT (Problem-Solving Card Text) parsing to accurately identify:
- Monster Quick Effects that activate from hand
- Trap cards with hand activation clauses
- Properly handles multi-effect cards

### Combo Brick Logic
A combo is "bricked" when ANY copy of a defined brick card is drawn (strict "Garnet" logic).

### Vulnerability System
Define threats (opponent's cards) and answers (your protection) to analyze how often your combos are exposed.

## License

MIT

---

Built with ❤️ for the Yu-Gi-Oh! community
