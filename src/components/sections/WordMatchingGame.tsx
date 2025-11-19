'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Star, 
  RefreshCw, 
  Zap, 
  Target,
  Volume2,
  Play,
  Pause
} from 'lucide-react'

interface WordTile {
  id: string
  word: string
  row: number
  col: number
  isMatched: boolean
  isAnimating: boolean
  isCorrect: boolean
}

interface GameStats {
  score: number
  moves: number
  level: number
  combo: number
  highScore: number
  timeLeft: number
  isPlaying: boolean
}

const GRID_SIZE = 8

const ENGLISH_WORDS = [
  // Easy words (3-4 letters)
  'CAT', 'DOG', 'RUN', 'JUMP', 'PLAY', 'BOOK', 'READ', 'WRITE', 'SING', 'DANCE',
  'WALK', 'TALK', 'EAT', 'DRINK', 'SLEEP', 'WORK', 'STUDY', 'LEARN', 'TEACH',
  'LOVE', 'LIKE', 'MAKE', 'TAKE', 'GIVE', 'COME', 'GO', 'SEE', 'SAY', 'TELL',
  'ASK', 'THINK', 'KNOW', 'GET', 'PUT', 'KEEP', 'LOOK', 'TURN', 'MOVE', 'CHANGE',
  
  // Medium words (5-6 letters)
  'HAPPY', 'SMILE', 'LAUGH', 'CRY', 'DREAM', 'HOPE', 'WISH', 'WANT', 'NEED', 'HAVE',
  'DOES', 'DID', 'DONE', 'MAKE', 'MADE', 'TAKE', 'TOOK', 'TAKEN', 'COME', 'CAME',
  'WRITE', 'WROTE', 'WRITTEN', 'READ', 'SPEAK', 'SPOKE', 'SPOKEN', 'BREAK', 'BROKE',
  'BROKEN', 'CHOOSE', 'CHOSE', 'CHOSEN', 'FORGET', 'FORGOT', 'FORGOTTEN', 'BEGIN',
  
  // Hard words (7+ letters)
  'BEAUTIFUL', 'WONDERFUL', 'AMAZING', 'FANTASTIC', 'EXCELLENT', 'PERFECT', 'AWESOME',
  'INCREDIBLE', 'FABULOUS', 'TERRIFIC', 'SPECTACULAR', 'MAGNIFICENT', 'MARVELOUS',
  'OUTSTANDING', 'EXTRAORDINARY', 'PHENOMENAL', 'ASTONISHING', 'BREATHTAKING',
  'UNBELIEVABLE', 'UNFORGETTABLE', 'UNSTOPPABLE', 'UNBREAKABLE', 'UNBEATABLE'
]

const WordMatchingGame = () => {
  const [grid, setGrid] = useState<WordTile[][]>([])
  const [selectedTile, setSelectedTile] = useState<WordTile | null>(null)
  const [matchedWords, setMatchedWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState<string>('')
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    moves: 0,
    level: 1,
    combo: 0,
    highScore: 0,
    timeLeft: 120,
    isPlaying: false
  })

  const generateWordTile = (row: number, col: number): WordTile => {
    const wordList = ENGLISH_WORDS.filter(word => word.length <= 3 + gameStats.level)
    return {
      id: `${row}-${col}-${Date.now()}`,
      word: wordList[Math.floor(Math.random() * wordList.length)],
      row,
      col,
      isMatched: false,
      isAnimating: false,
      isCorrect: false
    }
  }

  const initializeGrid = useCallback(() => {
    const newGrid: WordTile[][] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = generateWordTile(row, col)
      }
    }
    return newGrid
  }, [gameStats.level])

  const startGame = () => {
    setGameStats(prev => ({ 
      ...prev, 
      score: 0, 
      moves: 0, 
      level: 1, 
      combo: 0,
      timeLeft: 120,
      isPlaying: true 
    }))
    setGrid(initializeGrid())
    setMatchedWords([])
    setCurrentWord('')
    setSelectedTile(null)
  }

  const pauseGame = () => {
    setGameStats(prev => ({ ...prev, isPlaying: false }))
  }

  const resumeGame = () => {
    setGameStats(prev => ({ ...prev, isPlaying: true }))
  }

  const findMatches = (currentGrid: WordTile[][]): Set<string> => {
    const matches = new Set<string>()
    
    // Check horizontal matches (same words)
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 1; col++) {
        const word = currentGrid[row][col].word
        const consecutiveWords = [currentGrid[row][col].id]
        
        for (let nextCol = col + 1; nextCol < GRID_SIZE; nextCol++) {
          if (currentGrid[row][nextCol].word === word) {
            consecutiveWords.push(currentGrid[row][nextCol].id)
          } else {
            break
          }
        }
        
        if (consecutiveWords.length >= 2) {
          consecutiveWords.forEach(id => matches.add(id))
        }
      }
    }
    
    // Check vertical matches (same words)
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 1; row++) {
        const word = currentGrid[row][col].word
        const consecutiveWords = [currentGrid[row][col].id]
        
        for (let nextRow = row + 1; nextRow < GRID_SIZE; nextRow++) {
          if (currentGrid[nextRow][col].word === word) {
            consecutiveWords.push(currentGrid[nextRow][col].id)
          } else {
            break
          }
        }
        
        if (consecutiveWords.length >= 2) {
          consecutiveWords.forEach(id => matches.add(id))
        }
      }
    }
    
    return matches
  }

  const removeMatches = (currentGrid: WordTile[][], matches: Set<string>): WordTile[][] => {
    const newGrid = currentGrid.map(row =>
      row.map(tile => ({
        ...tile,
        isMatched: matches.has(tile.id),
        isAnimating: matches.has(tile.id),
        isCorrect: matches.has(tile.id)
      }))
    )

    // Add matched words to the list
    const matchedWordsList = Array.from(matches).map(id => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (currentGrid[row][col].id === id) {
            return currentGrid[row][col].word
          }
        }
      }
      return ''
    }).filter(word => word !== '')

    setMatchedWords(prev => [...new Set([...prev, ...matchedWordsList])])
    
    return newGrid
  }

  const dropTiles = (currentGrid: WordTile[][]): WordTile[][] => {
    const newGrid = currentGrid.map(row => [...row])
    
    for (let col = 0; col < GRID_SIZE; col++) {
      let writePosition = GRID_SIZE - 1
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (!newGrid[row][col].isMatched) {
          if (row !== writePosition) {
            newGrid[writePosition][col] = { ...newGrid[row][col], row: writePosition }
          }
          writePosition--
        }
      }
      
      for (let row = writePosition; row >= 0; row--) {
        newGrid[row][col] = generateWordTile(row, col)
      }
    }
    
    return newGrid
  }

  const calculateScore = (matches: Set<string>): number => {
    const baseScore = matches.size * 15
    const comboBonus = gameStats.combo * 10
    const levelBonus = gameStats.level * 5
    return baseScore + comboBonus + levelBonus
  }

  const processMatches = useCallback(async () => {
    let currentGrid = [...grid]
    let totalScore = 0
    let comboCount = 0
    
    while (true) {
      const matches = findMatches(currentGrid)
      
      if (matches.size === 0) break
      
      comboCount++
      totalScore += calculateScore(matches)
      
      currentGrid = removeMatches(currentGrid, matches)
      setGrid(currentGrid)
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      currentGrid = dropTiles(currentGrid)
      setGrid(currentGrid)
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setGameStats(prev => ({
      ...prev,
      score: prev.score + totalScore,
      combo: comboCount,
      level: Math.floor((prev.score + totalScore) / 200) + 1,
      highScore: Math.max(prev.highScore, prev.score + totalScore)
    }))
  }, [grid, gameStats.combo, gameStats.level, gameStats.score])

  const swapTiles = (tile1: WordTile, tile2: WordTile) => {
    const newGrid = grid.map(row => [...row])
    
    const temp = newGrid[tile1.row][tile1.col]
    newGrid[tile1.row][tile1.col] = { ...newGrid[tile2.row][tile2.col], row: tile1.row, col: tile1.col }
    newGrid[tile2.row][tile2.col] = { ...temp, row: tile2.row, col: tile2.col }
    
    setGrid(newGrid)
    setGameStats(prev => ({ ...prev, moves: prev.moves + 1 }))
    
    const matches = findMatches(newGrid)
    if (matches.size > 0) {
      setTimeout(() => processMatches(), 100)
    } else {
      // Swap back if no matches
      setTimeout(() => {
        const revertGrid = newGrid.map(row => [...row])
        const temp = revertGrid[tile1.row][tile1.col]
        revertGrid[tile1.row][tile1.col] = { ...revertGrid[tile2.row][tile2.col], row: tile1.row, col: tile1.col }
        revertGrid[tile2.row][tile2.col] = { ...temp, row: tile2.row, col: tile2.col }
        setGrid(revertGrid)
      }, 400)
    }
  }

  const handleTileClick = (tile: WordTile) => {
    if (!gameStats.isPlaying) return
    
    if (!selectedTile) {
      setSelectedTile(tile)
      setCurrentWord(tile.word)
    } else {
      const isAdjacent = 
        (Math.abs(selectedTile.row - tile.row) === 1 && selectedTile.col === tile.col) ||
        (Math.abs(selectedTile.col - tile.col) === 1 && selectedTile.row === tile.row)
      
      if (isAdjacent) {
        swapTiles(selectedTile, tile)
        setCurrentWord('')
      } else {
        setSelectedTile(tile)
        setCurrentWord(tile.word)
      }
    }
  }

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const getTileColor = (word: string, isSelected: boolean, isMatched: boolean, isAnimating: boolean) => {
    if (isMatched || isAnimating) return 'bg-green-500 text-white scale-110'
    if (isSelected) return 'bg-yellow-400 text-[#0a233b] scale-110 ring-4 ring-yellow-300'
    
    const wordLength = word.length
    if (wordLength <= 3) return 'bg-blue-500 text-white hover:bg-blue-600'
    if (wordLength <= 5) return 'bg-purple-500 text-white hover:bg-purple-600'
    return 'bg-red-500 text-white hover:bg-red-600'
  }

  // Timer effect
  useEffect(() => {
    if (gameStats.isPlaying && gameStats.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameStats(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameStats.timeLeft === 0) {
      setGameStats(prev => ({ ...prev, isPlaying: false }))
    }
  }, [gameStats.isPlaying, gameStats.timeLeft])

  // Initialize grid when game starts
  useEffect(() => {
    if (gameStats.isPlaying && grid.length === 0) {
      setGrid(initializeGrid())
    }
  }, [gameStats.isPlaying, grid.length, initializeGrid])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <section className="py-20 bg-gradient-to-br from-[#0a233b] to-[#1a3a52]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Word Matching <span className="text-yellow-400">Game</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Match English words to score points! Just like Candy Crush, but with educational value.
            Match 2 or more same words horizontally or vertically.
          </p>
          
          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-yellow-400 text-2xl font-bold">{gameStats.score}</div>
                <div className="text-gray-300 text-sm">Score</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-blue-400 text-2xl font-bold">{gameStats.moves}</div>
                <div className="text-gray-300 text-sm">Moves</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-green-400 text-2xl font-bold">{gameStats.level}</div>
                <div className="text-gray-300 text-sm">Level</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-purple-400 text-2xl font-bold">{gameStats.combo}x</div>
                <div className="text-gray-300 text-sm">Combo</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-red-400 text-2xl font-bold">{formatTime(gameStats.timeLeft)}</div>
                <div className="text-gray-300 text-sm">Time</div>
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {!gameStats.isPlaying ? (
              <Button 
                onClick={startGame}
                className="bg-yellow-400 text-[#0a233b] hover:bg-yellow-300 px-8 py-4 text-lg font-semibold"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            ) : (
              <>
                <Button 
                  onClick={pauseGame}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  onClick={startGame}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Game
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Game Grid */}
        {gameStats.isPlaying && (
          <div className="flex justify-center mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="grid grid-cols-8 gap-1 max-w-2xl">
                {grid.map((row, rowIndex) =>
                  row.map((tile, colIndex) => (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClick(tile)}
                      className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-lg font-bold text-sm md:text-base
                        transition-all duration-300 transform hover:scale-105
                        ${getTileColor(tile.word, selectedTile?.id === tile.id, tile.isMatched, tile.isAnimating)}
                        shadow-lg
                      `}
                    >
                      {tile.word}
                    </button>
                  ))
                )}
              </div>
              
              {/* Current Word Display */}
              {currentWord && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
                    <span className="text-white font-semibold">Selected:</span>
                    <span className="text-yellow-400 font-bold">{currentWord}</span>
                    <button
                      onClick={() => speakWord(currentWord)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Matched Words Display */}
        {matchedWords.length > 0 && (
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Words You've Matched:</h3>
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {matchedWords.map((word, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Game Instructions */}
        {!gameStats.isPlaying && (
          <div className="text-center max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">How to Play</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-400 text-[#0a233b] rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="text-white font-semibold">Click to Select</h4>
                      <p className="text-gray-300 text-sm">Click a word tile, then click an adjacent word to swap them</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-400 text-[#0a233b] rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="text-white font-semibold">Match Words</h4>
                      <p className="text-gray-300 text-sm">Match 2 or more same words horizontally or vertically</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-400 text-[#0a233b] rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="text-white font-semibold">Score Points</h4>
                      <p className="text-gray-300 text-sm">Longer matches give more points. Build combos for bonus points!</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-400 text-[#0a233b] rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div>
                      <h4 className="text-white font-semibold">Learn English</h4>
                      <p className="text-gray-300 text-sm">Click the speaker icon to hear word pronunciation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-center space-x-4 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Easy words (3-4 letters)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">Medium words (5-6 letters)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Hard words (7+ letters)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* CTA to Full Game */}
        <div className="text-center mt-12">
          <p className="text-gray-300 mb-4">Want more challenges and features?</p>
          <Button 
            size="lg"
            className="bg-yellow-400 text-[#0a233b] hover:bg-yellow-300 px-8 py-4 text-lg font-semibold"
            onClick={() => window.location.href = '/game'}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Play Full Game
          </Button>
        </div>
      </div>
    </section>
  )
}

export default WordMatchingGame