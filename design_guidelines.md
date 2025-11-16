# Design Guidelines: Multiplayer Drawing Game

## Design Approach
**Reference-Based Approach** inspired by Skribbl.io, Gartic Phone, and Among Us's playful aesthetics. The design prioritizes fun, clarity, and immediate visual feedback for fast-paced gameplay.

## Core Design Principles
1. **Playful Energy**: Vibrant, cheerful interface that encourages social interaction
2. **Instant Clarity**: Game state always obvious at a glance (who's drawing, time left, scores)
3. **Zero Confusion**: Clear visual hierarchy for primary actions vs. secondary info
4. **Responsive Fun**: All interactions feel snappy and rewarding

## Typography
- **Primary Font**: Poppins (Google Fonts) - rounded, friendly, highly legible
  - Display/Headers: 700 weight, 24-48px
  - Body/UI: 500-600 weight, 14-18px
  - Chat/Small text: 400 weight, 12-14px
- **Monospace Font**: 'Courier New' for room codes only

## Layout System
**Tailwind Spacing**: Consistent use of 2, 4, 6, 8, 12, 16, 20 units
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-8
- Container margins: mx-4 to mx-8

## Component Library

### Lobby Screen
**Layout**: Centered card (max-w-4xl) with room info at top
- Room code display: Large, prominent with copy button
- Player grid: 2-4 columns showing avatars, names, ready status
- Avatar selector: Horizontal scrollable carousel (8-12 avatar options)
- Game mode selector: Large button grid (2x2 or 3x2), each mode with icon and description
- Start button: Full-width, large (h-14), only visible to room host

### Game Screen
**Layout**: Split-panel design
- **Left Panel (65% width)**: Drawing canvas area
  - Canvas: White background, rounded corners (rounded-lg), subtle shadow
  - Word display: Above canvas - blanks for guessers, full word for drawer
  - Drawing toolbar: Below canvas with tool buttons in horizontal row
  
- **Right Panel (35% width)**: Game info + chat
  - Timer: Circular progress indicator at top (large, 80-100px diameter)
  - Score board: Compact player list with avatars and scores
  - Chat: Scrollable message feed with input at bottom

### Drawing Tools
**Toolbar Design**: Single horizontal row of icon buttons
- Brush sizes: 3 buttons (S/M/L) with visual size indicators
- Color picker: 12 preset color swatches in grid
- Eraser button
- Clear canvas button (with confirmation)
- All tools: 40x40px buttons with rounded-md borders

### Chat Interface
- Message bubbles: Rounded rectangles with alternating alignment
- Correct guesses: Highlighted with success indicator
- System messages: Centered, italic, muted
- Input field: Full-width with send button integrated

### Avatar Selection
**Design**: Colorful, simple character illustrations
- Style: Geometric shapes with playful features (circles, triangles for bodies)
- Options: 12 unique avatars in varied colors
- Display: 64x64px in selector, 40x40px in game

### Game Mode Cards
**Visual Treatment**: Each mode gets distinctive icon and accent
- Card size: Equal height, responsive width
- Content: Icon (48px) + Mode name + 1-line description + player count info
- States: Default, hover (lift effect), selected (border highlight)

### Timer Component
**Design**: Circular progress ring
- Shows remaining seconds as number in center
- Ring depletes clockwise
- Color transitions: green → yellow → red as time runs out
- Pulse animation in final 5 seconds

### Scoring Display
**Layout**: Compact player rows
- Avatar (32px) + Name + Score
- Current drawer: Highlighted with drawing icon
- Top 3 players: Trophy icons (gold/silver/bronze)

## Interaction Patterns

### State Indicators
- Drawing phase: Canvas border pulses gently
- Guessing phase: Chat input highlighted
- Round transitions: Full-screen announcement overlay (2s)
- Correct guess: Celebratory particle effect on player row

### Feedback
- Button clicks: Subtle scale down (scale-95)
- Successful actions: Brief success toast (top-right)
- Drawing strokes: Smooth, no lag, 60fps target
- Chat messages: Slide-in animation from bottom

## Responsive Breakpoints
- **Mobile (< 768px)**: Stack canvas above chat, simplified toolbar
- **Tablet (768-1024px)**: Maintain split but narrower margins
- **Desktop (> 1024px)**: Full split-panel layout with maximum canvas size

## Images
No hero images needed. The application is utility-focused with these visual elements:
- Avatar illustrations: 12 unique character designs (simple, colorful, SVG format)
- Game mode icons: Custom icons for each mode (draw, double-draw, blitz, random, mega)
- UI decorations: Subtle background patterns in lobby (optional confetti/doodles)

## Special Mode Considerations
- **Double Draw Mode**: Split canvas vertically with subtle divider
- **Randomized Mode**: Visual indicator when brush changes (brief overlay)
- **Mega Mode**: Condensed player list with scroll, prioritize top scorers

## Animation Budget
Minimal animations for performance:
- Timer countdown: Smooth rotation
- Round transitions: Quick fade
- Correct guesses: Brief confetti burst
- NO continuous background animations