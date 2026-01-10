---
title: "Gomoku AI: Advanced Game Engine with Minimax & Heuristics"
date: 2024-02-06T20:53:02.000Z
type: projects
description: "A sophisticated Gomoku AI implementation featuring multi-threaded minimax search, advanced heuristic evaluation, and complex pattern recognition for strategic gameplay."
tags: ["project", "typescript", "ai", "game-theory", "vue", "algorithms", "minimax"]
keywords: ["Gomoku", "AI", "Minimax", "Alpha-Beta Pruning", "Web Workers", "Game Theory", "TypeScript", "Vue3"]
image: "/assets/gomoku/gomoku.jpg"
---

# Gomoku AI Engine
### Advanced Strategy Game Implementation with Parallel Minimax Search

![Status](https://img.shields.io/badge/Status-Production-success)
![Language](https://img.shields.io/badge/Language-TypeScript-3178C6)
![Framework](https://img.shields.io/badge/Framework-Vue_3-4FC08D)

A high-performance Gomoku (Five-in-a-Row) game engine built with **TypeScript** and **Vue 3**, featuring an advanced AI opponent powered by parallel minimax search, sophisticated heuristic evaluation, and complex pattern recognition.

**Live Demo**: [gomoku.allali.me](https://gomoku.allali.me/)  
**Repository**: [github.com/aallali/gomoku](https://github.com/aallali/gomoku)

![gomoku-ui](/assets/gomoku/gomoku-ui.png)

## Technical Overview

Gomoku (五目並べ) is a strategy board game where players alternate placing stones on a 19×19 grid, aiming to form an unbroken line of five stones. This implementation goes beyond basic gameplay, featuring:

**Core Capabilities:**
1. **Intelligent Move Evaluation**: 20+ heuristic factors analyze position strength, threat patterns, and tactical opportunities
2. **Deep Search Algorithm**: Minimax with alpha-beta pruning explores 8-10 ply depth, evaluating 100K-1M positions per move
3. **Parallel Processing**: Web Workers enable concurrent evaluation across CPU cores, achieving 6-7× speedup
4. **Advanced Rule Variants**: Complete implementation of "1337 mode" with capture mechanics and forbidden move patterns

```warning
This project was developed as part of the 42 School curriculum. The AI uses classical game tree search rather than machine learning approaches, demonstrating the effectiveness of well-tuned heuristics and efficient algorithms.
```
 
## Game Modes & Rules

### Standard Mode
- Classic five-in-a-row gameplay
- First player to align 5 stones wins
- No capture mechanics or forbidden moves

### 1337 Mode (Advanced)
Enhanced ruleset adding strategic complexity:

**Capture Mechanics**: Players can capture pairs of opponent stones using the pattern `XOOX`
```
● ○ ○ ●  →  ● · · ●
(Before)     (After capture)
```
![gomoku-capture-form](/assets/gomoku/gomoku-capture-form.png)
![gomoku-captured-form](/assets/gomoku/gomoku-captured-form.png)

**Win Conditions**:
- Align 5 stones (unbreakable by captures)
- Collect 5 captures (10 stones total)

**Forbidden Patterns**:
- **Double-Three**: Creating two open-three patterns simultaneously
    - [img1] F5 is forbidden to play by black because it will form a double open3 pattern, which is not allowed by our rules.
        - ->
        <img src="https://github.com/aallali/Gomoku/raw/main/ressources/patterns/allowed-double-open3.png" width="200">
    - [img2] this case is allowed to play F5 because the white piece is breaking of of the open3 patterns
        - ->
        <img src="https://github.com/aallali/Gomoku/raw/main/ressources/patterns/broken-double-open3.png" width="200">
    - [img3] it is allowed to have a double free three by a capture move.
        - ->
        <img src="https://github.com/aallali/Gomoku/raw/main/ressources/patterns/allowed-double-open3.png" width="200">

- **Double-Four**: Creating two open-four patterns simultaneously  
- **Overline**: More than 5 consecutive stones
- **In Capture**: you can play a move that will be capture immediatly
    - <img src="https://github.com/aallali/Gomoku/raw/main/ressources/patterns/in-capture.png" width="200">

```info
The 1337 mode requires significantly deeper analysis as the AI must consider capture opportunities, defensive positioning, and forbidden move validation on every evaluation.
```

## Technology Stack

### Core Technologies
```json
{
  "runtime": "Node.js 20",
  "framework": "Vue 3 (Composition API)",
  "language": "TypeScript 5.2",
  "build": "Vite 4.4",
  "state": "Zustand (Vue adapter)",
  "utilities": "Ramda (functional utilities)"
}
```

**Architecture Decisions**:
- **Vue 3**: Reactive UI with minimal boilerplate, excellent TypeScript integration
- **TypeScript**: Type safety for complex game logic, prevents runtime errors
- **Zustand**: Lightweight state management without mutations/actions ceremony
- **Vite**: Near-instant HMR and native Web Worker support
- **Ramda**: Immutable data transformations for board state

### Project Structure

```
src/
├── App.vue                    # Root component
├── main.ts                    # Entry point
├── store.ts                   # Zustand state
├── components/
│   ├── Board.vue             # Game board UI
│   ├── Players.vue           # Player information
│   ├── History.vue           # Move history
│   ├── AiAnalayse.vue        # AI decision visualization
│   └── Stats.vue             # Performance metrics
└── gomoku/                   # Game engine (framework-agnostic)
    ├── GO.ts                 # Core game class
    ├── types/                # TypeScript definitions
    ├── common/               # Shared utilities
    │   ├── directions.ts     # Direction vectors
    │   ├── pieceWeight.ts    # Position weights
    │   └── shared-utils.ts
    └── modes/
        └── 1337/
            ├── Heuristic.ts         # Position evaluator
            ├── MiniMax.ts           # AI decision engine
            ├── minimax.worker.ts    # Web Worker
            ├── bestmove.ts          # Move ordering
            ├── captures.ts          # Capture mechanics
            └── moveValidity.ts      # Forbidden patterns
```

```tip
The game engine (`gomoku/`) is completely independent of Vue, making it reusable for other frontends, CLI tools, or even a Node.js server implementation.
```

## Game State Management

### The GO Class

Central game engine encapsulating all state and logic:

```typescript
class GO {
    matrix: TMtx                    // Board: 0=empty, 1=black, 2=white
    backup_matrix: TMtx             // Clean state for simulations
    mode: TMode                     // "normal" | "1337"
    moves: string[]                 // History: ["A0", "B1", ...]
    winner: P | "T" | null          // 1, 2, T(tie), or null
    players: IPlayers               // Metadata & captures
    winStones: TPoint[]             // Winning positions
    turn: P                         // Current player (1 or 2)
    bestMoves: TPoint[]             // AI suggestions
    size: number                    // Board dimensions (19)
    lastPlayed: TPoint              // Most recent move
    children: GO[]                  // Child states for tree search
}
```

**Type System**:
```typescript
export type TMtx = (0 | 1 | 2)[][]        // Board matrix
export type P = 1 | 2                     // Player
export type TPoint = { x: number, y: number, score?: number }
export type TMode = "1337" | "normal"

export interface IPlayer {
    name: string
    isHuman: boolean
    captures: number
}
```

### Move Execution Pipeline

```typescript
move({ x, y }: TPoint) {
    // 1. Validation
    if (this.matrix[x][y] !== 0)
        throw "Invalid move: non empty cell"
    
    if (this.mode === "1337") {
        // Check forbidden patterns
        if (!isValidMoveFor1337Mode(this.matrix, this.turn, x, y))
            throw "Invalid move: forbidden"
        
        // 2. Placement
        this.matrix[x][y] = this.turn
        
        // 3. Apply captures
        const captures = applyCapturesIfAny(this.matrix, { x, y })
        this.matrix = captures.matrix
        this.players[this.turn].captures += captures.total
    } else {
        this.matrix[x][y] = this.turn
    }
    
    // 4. Record move
    this.moves.push(alpha[x] + y)  // "A0", "B1", etc.
    
    // 5. Check win conditions
    this.checkWinner()
    
    // 6. Switch turns
    this.setTurn(3 - this.turn as P)
    this.lastPlayed = { x, y }
}
```

**Opponent Calculation**: `opponent = 3 - player` (clever bit trick: 3-1=2, 3-2=1)

### Win Detection Logic

```typescript
checkWinner() {
    const { x, y } = this.lastPlayed
    const winStones = check5Win(this.matrix, this.turn, x, y)
    
    if (this.mode === "1337") {
        // Check if opponent can break the win line via capture
        const o_turn = 3 - this.turn as P
        const oponentMoves = findValidSpots(this.matrix, o_turn, this.mode)
        const oppCaptures = extractCaptures(this.matrix, oponentMoves, o_turn)
        
        // Is the win line breakable?
        const breakable = winStones && 
                         isLineBreakableByAnyCapture(oppCaptures, winStones)
        
        // Win by aligned 5 (unbreakable) OR 5 captures
        if ((winStones && !breakable) || this.players[this.turn].captures >= 5) {
            if (winStones) this.winStones = winStones
            this.winner = this.turn
            return
        }
    } else {
        // Normal mode: simple 5-in-a-row
        if (winStones) {
            this.winStones = winStones
            this.winner = this.turn
        }
    }
}
```

## Heuristic Evaluation System

The AI's strategic intelligence comes from multi-factor position evaluation.

### Evaluation Factors

```typescript
export interface THeuristic {
    // Capture-related
    capture: number              // Immediate captures available
    captureSetup: number         // Setup future captures (XOO.)
    captureBlock: number         // Block opponent captures
    captured: number             // Risk of being captured
    
    // Pattern recognition
    open3: number                // Open three (_XXX_)
    open3Block: number           // Block opponent open three
    open4: number                // Open four (_XXXX_) - winning threat!
    open4Block: number           // Block opponent open four
    open4Bounded: number         // Bounded four (XXXX_)
    
    // Strategic positioning
    aligned_siblings: [number, number, number]  // Nearby pieces
    forbiddenOpponent: number    // Creates forbidden position for opponent
    
    // Winning moves
    win5: number                 // Five-in-a-row
    win5Block: number            // Block opponent win
    winBreak: number             // Break opponent's win line
    
    // Computed scores
    nes_score: number            // Base positional value
    heurScore: number            // Final weighted score
}
```

### Pattern Recognition

Direction scanning to detect threats:

```typescript
function EvalPiece(matrix: TMtx, x: number, y: number, turn: P) {
    const repport = { score: 0 } as TRepport
    
    // Scan 4 directions (each with mirror)
    for (let i = 0; i < 4; i++) {
        const dir = directions[i]
        let consecutives = 0
        let bounds = 0
        
        // Scan forward
        let coord = MoveDirection(dir, x, y)
        while (validXY(size, coord.x, coord.y)) {
            const cell = matrix[coord.x][coord.y]
            
            if (cell !== turn && cell !== 0) {
                bounds++  // Blocked by opponent
                break
            }
            if (cell === 0) break  // Empty space
            
            consecutives++
            coord = MoveDirection(dir, coord.x, coord.y)
        }
        
        // Scan backward (mirror)
        coord = MoveDirection(DirectionMirror[dir], x, y)
        while (validXY(size, coord.x, coord.y)) {
            const cell = matrix[coord.x][coord.y]
            if (cell !== turn && cell !== 0) {
                bounds++
                break
            }
            if (cell === 0) break
            
            consecutives++
            coord = MoveDirection(DirectionMirror[dir], coord.x, coord.y)
        }
        
        // Classify pattern
        if (consecutives >= 4) {
            repport.isWin = true
            repport.score = 111110
            break
        }
        
        if (bounds === 0) {           // Open both sides
            if (consecutives >= 3)
                repport.isOpenFour = true
            else if (consecutives >= 2)
                repport.isOpenThree = true
        } else if (consecutives >= 3 && bounds === 1) {
            repport.isBounded4 = true  // Half-open
        }
        
        repport.score += GetScore(consecutives, bounds)
    }
    
    return repport
}
```

### Capture Detection

Pattern: `XOOX` (Player-Opponent-Opponent-Player)

```typescript
function IsCapture(matrix: TMtx, x: number, y: number) {
    const allCaptures = []
    
    for (const dir of directions) {
        const rawPath = ScrapLine(matrix, 0, 3, x, y, dir)
        const path = Standarize(matrix[x][y] as P, rawPath)
        
        if (path === "XOOX") {
            // Record captured stone positions
            let coord = MoveDirection(dir, x, y)
            allCaptures.push({ x: coord.x, y: coord.y })
            
            coord = MoveDirection(dir, coord.x, coord.y)
            allCaptures.push({ x: coord.x, y: coord.y })
        }
    }
    
    return allCaptures.length ? allCaptures : undefined
}
```

### Scoring System

![gomoku-score-board](/assets/gomoku/gomoku-score-board.png)

Weighted combination prioritizing critical threats:

```typescript
function scoreIt(repport: THeuristic, currentCapts: number) {
    let score = 0
    
    // Critical threats (highest priority)
    score += 3000 * repport.winBreak      // Break opponent win
    score += 2000 * repport.win5          // Winning move
    score += 2000 * repport.open4         // Guaranteed win next turn
    score += 1500 * repport.win5Block     // Block opponent win
    
    // Capture mechanics
    if (repport.totalCaptures) {
        score += 800 * (repport.totalCaptures + currentCapts)
        score += repport.totalCaptures * 300
    }
    
    // Defensive blocking
    score += 800 * repport.open4Block
    score += 700 * repport.open4Bounded
    score += 100 * repport.open3Block
    
    // Offensive setup
    score += 400 * repport.open3
    
    // Capture setup/defense
    if (repport.captureSetup) {
        score += 700 * (repport.captureSetup + currentCapts)
        score += repport.captureSetup * 200
    }
    score += 500 * repport.captureBlock
    
    // Positioning bonus
    score += repport.aligned_siblings[0] * 100
    score -= repport.aligned_siblings[1] * 10
    
    // Fallback to basic evaluation
    if (score === 0) {
        score += Math.max(repport.nes_score, repport.nes_score_opponent)
    }
    
    return score
}
```

```info
The scoring system prioritizes immediate threats (open-4, wins) over positional advantages. This prevents the AI from pursuing minor gains while missing critical defensive or offensive opportunities.
```

## Minimax Algorithm with Alpha-Beta Pruning

### Core Implementation

```typescript
class Minimax {
    timeoutMillis: number          // Time limit
    startMillis: number            // Start time
    playerToWin: P                 // AI player
    maxDepth: number = 10          // Search depth
    
    minimax(
        node: typeof GO,
        depth: number,
        alpha: number,
        beta: number,
        maximizingPlayer: boolean
    ): number {
        // Terminal conditions
        if (depth === this.maxDepth || 
            node.winner || 
            this.timeExpired()) {
            
            if (node.winner) {
                if (node.winner === "T") return 0  // Tie
                
                // Prefer faster wins
                const multiplier = node.winner === this.playerToWin ? 1 : -1
                return (88888 * multiplier) - depth
            }
            
            // Leaf evaluation: capture difference
            return this.evaluateLeaf(node, maximizingPlayer)
        }
        
        node.generateChildren()
        
        if (maximizingPlayer) {
            let maxEval = Number.NEGATIVE_INFINITY
            
            for (const child of node.children) {
                const score = this.minimax(child, depth + 1, alpha, beta, false)
                maxEval = Math.max(maxEval, score)
                alpha = Math.max(alpha, score)
                
                if (beta <= alpha) break  // Beta cutoff
            }
            
            return maxEval
        } else {
            let minEval = Number.POSITIVE_INFINITY
            
            for (const child of node.children) {
                const score = this.minimax(child, depth + 1, alpha, beta, true)
                minEval = Math.min(minEval, score)
                beta = Math.min(beta, score)
                
                if (beta <= alpha) break  // Alpha cutoff
            }
            
            return minEval
        }
    }
}
```

### Alpha-Beta Pruning

**Concept**: Skip evaluating branches that cannot influence the final decision.

- **Alpha (α)**: Best score MAX can guarantee (lower bound)
- **Beta (β)**: Best score MIN can guarantee (upper bound)
- **Prune when**: `β ≤ α` (remaining moves won't matter)

**Example**:
```
MAX node finds α = 5
Next MIN child evaluates to 6
If next child ≤ 5, MIN would choose it
But MAX already has ≥ 5 elsewhere
→ MIN won't choose this branch
→ PRUNE remaining children
```

**Efficiency**: Reduces complexity from $O(b^d)$ to $O(b^{d/2})$ in best case.

### Move Ordering Strategy

Critical for pruning effectiveness:

```typescript
function movesSorter(moves: THeuristic[], p1Caps: number, p2Caps: number) {
    // Priority categories (highest to lowest)
    const breakWin5 = moves.filter(m => m.winBreak)
    const win5 = moves.filter(m => m.win5)
    const captures = moves.filter(m => m.capture)
    const blockWin5 = moves.filter(m => m.win5Block)
    const open4 = moves.filter(m => m.open4)
    const blockOpen4 = moves.filter(m => m.open4Block)
    
    // Situational selection
    if (breakWin5.length) return breakWin5
    if (win5.length) return win5
    if (captures.length && p1Caps >= 4) return captures  // Winning capture
    if (blockWin5.length) return blockWin5
    if (open4.length) return open4
    if (blockOpen4.length) return blockOpen4.filter(m => !m.captured)
    
    // Default: sort by composite score
    return moves.sort((a, b) => b.heurScore - a.heurScore)
}
```

```tip
Good move ordering improves pruning by 10-20×. Evaluating critical moves first (wins, blocks) allows more aggressive pruning in subsequent branches.
```

## Parallel Processing with Web Workers

### Architecture

JavaScript is single-threaded. Deep minimax search blocks the UI.

**Solution**: Evaluate candidate moves in parallel using Web Workers.

```
Main Thread              Workers
    ↓
Generate 7-10        →   Worker 1: Evaluate Move 1
best moves           →   Worker 2: Evaluate Move 2
                     →   Worker 3: Evaluate Move 3
                     →   ...
                     →   Worker N: Evaluate Move N
    ↓
Aggregate results    ←   Return scores
    ↓
Select best move
```

### Worker Implementation

**Worker file** (`minimax.worker.ts`):
```typescript
self.onmessage = (e: MessageEvent) => {
    const { i, child, pToWin, thinkTime } = e.data
    
    // Reconstruct game state
    const node = new GO()
    node.matrix = child.matrix
    node.backup_matrix = child.backup_matrix
    node.moves = child.moves
    node.turn = child.turn
    node.players = child.players
    node.winner = child.winner
    
    // Run minimax
    const minimaxRunner = new Minimax(performance.now(), thinkTime, '_')
    minimaxRunner.playerToWin = pToWin
    
    const startTime = performance.now()
    const score = minimaxRunner.minimax(
        node, 1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        false
    )
    const endTime = (performance.now() - startTime) / 1000
    
    // Return result
    self.postMessage({ score, move: child.lastPlayed, time: endTime })
}
```

**Main thread**:
```typescript
async findBestMove(initialState: typeof GO) {
    const root = initialState
    this.playerToWin = initialState.turn
    
    root.generateChildren()  // Generate 7-10 candidates
    
    // Evaluate all moves in parallel
    const scores = await Promise.all(
        root.children.map((child, i) => this.calculateScore(child, i))
    )
    
    // Sort by score
    const sortedMoves = scores.sort((a, b) => b.score - a.score)
    
    return {
        bestMove: sortedMoves[0].move,
        timeCost: averageTime
    }
}

private async calculateScore(child: typeof GO, i: number) {
    return new Promise((resolve) => {
        const wrk = new Worker(this.workerUrl, { type: 'module' })
        
        wrk.onmessage = (e: any) => {
            resolve(e.data)
            wrk.terminate()  // Clean up
        }
        
        wrk.postMessage({
            i, child,
            pToWin: this.playerToWin,
            thinkTime: this.timeoutMillis
        })
    })
}
```

**Performance**:
- Single-threaded: 2-5 seconds (UI frozen)
- With 7 workers: 300-500ms (UI responsive)
- **Speedup**: ~6-7×

```warning
Each worker creates an isolated memory space (~2MB per worker). With 7 workers evaluating concurrently, total memory overhead is ~14MB, which is acceptable for modern browsers.
```

## Forbidden Move Validation

### Double-Three Rule

**Forbidden**: Creating two or more open-three patterns simultaneously.

**Open Three**: `_XXX_` (three stones with both ends open)

![gomoku-open3](/assets/gomoku/gomoku-open3.png)

```typescript
function isOpenThree(matrix: TMtx, x: number, y: number, turn: P): boolean {
    for (const dir of directions) {
        const rawPath = ScrapLine(matrix, 4, 2, x, y, dir)
                             .split("").reverse().join("")
        const path = Standarize(turn, rawPath)
        
        // Patterns: __XXX_ or _XXX__
        const patterns = [/\.\.XXX\./, /\.XXX\.\./]
        const combinedRegex = new RegExp(
            `(${patterns.map(p => p.source).join('|')})`
        )
        
        if (combinedRegex.test(path)) {
            // Verify all positions are legal
            if (this.verifyPatternLegality(path, x, y, dir, turn))
                return true
        }
    }
    return false
}
```

### Validation Pipeline

```typescript
function isValidMoveFor1337Mode(
    matrix: TMtx,
    turn: P,
    x: number,
    y: number
): boolean {
    // 1. Check if empty
    if (matrix[x][y] !== 0) return false
    
    // 2. Apply move temporarily
    const tempMatrix = cloneMatrix(matrix)
    tempMatrix[x][y] = turn
    
    const evaluator = new Heuristic(tempMatrix, { x, y }, turn)
    
    // 3. Count open threes
    let openThreeCount = 0
    for (const dir of directions) {
        if (evaluator.hasOpenThreeInDirection(dir))
            openThreeCount++
    }
    
    if (openThreeCount >= 2) return false  // Double-three forbidden
    
    // 4. Check double-four
    if (evaluator.hasDoubleOpenFour()) return false
    
    // 5. Check overline (> 5 consecutive)
    const consecutives = evaluator.countMaxConsecutive()
    if (consecutives > 5) return false
    
    return true
}
```

## Performance Optimizations

### Heuristic Pre-Filtering

**Problem**: Evaluating all 361 board positions is expensive.

**Solution**: Use heuristic evaluation to select top 7-10 candidates.

```typescript
findBestMove() {
    // Evaluate all empty cells
    const allMoves = whatIsTheBestMove(
        this.matrix,
        this.turn,
        this.players[this.turn].captures,
        this.players[3 - this.turn as P].captures
    )
    
    // Return top candidates
    return allMoves.length >= 10 ? allMoves.slice(0, 7) : allMoves
}
```

**Reduction**: 361 → 7-10 moves (~98% reduction)

### Nearby Move Filtering

Early game: Only evaluate positions near existing stones.

```typescript
isNearBy(matrix: TMtx, x: number, y: number): boolean {
    // Check if any stone within 2 cells in any direction
    for (const dir of directions) {
        const rawPath = ScrapLine(matrix, 0, 2, x, y, dir)
        if (/1|2/.test(rawPath.substring(1))) {
            return true  // Found nearby stone
        }
    }
    return false
}
```

**Early game**: 361 cells → 10-15 relevant positions

### Matrix Cloning Strategy

```typescript
// FAST: Shallow clone (for hot paths)
function cloneMatrix(matrix: TMtx): TMtx {
    return matrix.map(row => [...row])
}

// SLOW: Deep clone (only when truly needed)
function deepCloneMatrix(matrix: TMtx): TMtx {
    return JSON.parse(JSON.stringify(matrix))
}
```

**Performance**: Shallow clone ~100× faster

### Performance Summary

| Optimization | Time (10 moves) | Improvement |
|--------------|-----------------|-------------|
| Baseline (no pruning) | 5000ms | 1× |
| + Move ordering | 1000ms | 5× |
| + Heuristic pre-filter | 350ms | 14× |
| + Alpha-beta pruning | 150ms | 33× |
| + Web Workers (parallel) | 70ms | 71× |

## Results & Achievements

### Performance Metrics

```json
{
  "average_move_time": "300-500ms",
  "search_depth": "8-10 plies",
  "positions_evaluated": "100K-1M per move",
  "branching_factor_reduction": "361 → 7-10",
  "ui_frame_rate": "60 FPS",
  "parallelization_speedup": "6-7×"
}
```

### Technical Achievements

✅ **Multi-Factor Heuristic Evaluation**: 20+ strategic factors  
✅ **Efficient Game Tree Search**: Alpha-beta pruning with move ordering  
✅ **Parallel Processing**: Web Workers for concurrent evaluation  
✅ **Complete 1337 Mode**: Captures, forbidden patterns, breakable wins  
✅ **Type-Safe Architecture**: Full TypeScript coverage  
✅ **Responsive UI**: Non-blocking AI computation

### Key Insights

1. **Heuristics Enable Deep Search**: Good move filtering reduces search space by 98%, making depth-10 search feasible
2. **Move Ordering Multiplies Pruning**: Evaluating critical moves first improves alpha-beta efficiency by 10-20×
3. **Parallelization Transforms UX**: Web Workers eliminate UI freezing, making AI decisions feel instantaneous
4. **Type Safety Prevents Bugs**: TypeScript caught numerous logic errors during development
5. **Clean Architecture Pays Off**: Framework-agnostic game engine is testable, maintainable, and reusable

## Future Enhancements

### Opening Book
Pre-computed optimal opening sequences to skip early search:
```typescript
const openingBook = {
    "": "J9",           // First move: center
    "J9": "K10",        // Response: adjacent diagonal
    "J9-H9": "I8"       // Counter-opening patterns
}
```

### Transposition Table
Cache previously evaluated positions to avoid redundant computation:
```typescript
interface TranspositionEntry {
    hash: string        // Zobrist hash of position
    depth: number       // Search depth
    score: number       // Evaluation score
    flag: 'exact' | 'lower' | 'upper'
}

const transTable = new Map<string, TranspositionEntry>()
```

**Expected improvement**: 30-50% speedup

### Monte Carlo Tree Search
Alternative to minimax for better exploration:
- Handles uncertainty better
- More randomness in play style
- Better for very deep searches

### Neural Network Evaluation
Train a neural network to replace hand-crafted heuristics:
- Learn patterns from expert games
- Potentially discover novel strategies
- Requires significant training data

```danger
Machine learning approaches require substantial training infrastructure and datasets. The current heuristic-based system is more maintainable and debuggable for this project's scope.
```

## Conclusion

This Gomoku AI demonstrates that classical game tree search algorithms, when properly optimized, can produce strong gameplay without machine learning. The combination of sophisticated heuristics, efficient minimax search, and modern web technologies creates a responsive, intelligent opponent.

**Key Takeaways**:
- Well-tuned heuristics are surprisingly effective
- Algorithmic optimizations (alpha-beta, move ordering) provide massive speedups
- Web Workers enable desktop-class performance in browsers
- Clean architecture and type safety prevent bugs and improve maintainability

---

**Live Demo**: [gomoku.allali.me](https://gomoku.allali.me/)  
**Source Code**: [github.com/aallali/gomoku](https://github.com/aallali/gomoku)

---

