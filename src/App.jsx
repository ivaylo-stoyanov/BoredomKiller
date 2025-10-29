import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { useTheme } from './ThemeContext'

const GAME_WIDTH = 800
const GAME_HEIGHT = 400
const PLAYER_WIDTH = 60
const PLAYER_HEIGHT = 80
const PLAYER_HEAD_SIZE = 50
const OBSTACLE_WIDTH = 30
const OBSTACLE_HEIGHT = 60
const GRAVITY = 0.6
const JUMP_STRENGTH = -12
const GAME_SPEED = 5
const OBSTACLE_SPAWN_INTERVAL = 2000

function App() {
  const { theme, toggleTheme } = useTheme()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - PLAYER_HEIGHT - 50)
  const [playerVelocity, setPlayerVelocity] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const [obstacles, setObstacles] = useState([])

  const gameLoopRef = useRef()
  const obstacleIntervalRef = useRef()
  const playerVelocityRef = useRef(0)
  const playerYRef = useRef(playerY)

  // Update refs when state changes
  useEffect(() => {
    playerYRef.current = playerY
  }, [playerY])

  useEffect(() => {
    playerVelocityRef.current = playerVelocity
  }, [playerVelocity])

  // Check collision
  const checkCollision = useCallback((playerY, obstacles) => {
    const playerLeft = 100
    const playerRight = playerLeft + PLAYER_WIDTH
    const playerTop = playerY
    const playerBottom = playerY + PLAYER_HEIGHT

    for (let obstacle of obstacles) {
      const obstacleLeft = obstacle.x
      const obstacleRight = obstacle.x + OBSTACLE_WIDTH
      const obstacleTop = GAME_HEIGHT - OBSTACLE_HEIGHT - 50
      const obstacleBottom = GAME_HEIGHT - 50

      if (
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom
      ) {
        return true
      }
    }
    return false
  }, [])

  // Jump function
  const jump = useCallback(() => {
    if (!gameStarted || gameOver) return

    const ground = GAME_HEIGHT - PLAYER_HEIGHT - 50
    if (playerYRef.current >= ground - 5) {
      setPlayerVelocity(JUMP_STRENGTH)
      setIsJumping(true)
    }
  }, [gameStarted, gameOver])

  // Start game
  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setPlayerY(GAME_HEIGHT - PLAYER_HEIGHT - 50)
    setPlayerVelocity(0)
    setObstacles([])
    setIsJumping(false)
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    gameLoopRef.current = setInterval(() => {
      // Update player position
      setPlayerY((prevY) => {
        let newY = prevY + playerVelocityRef.current
        const ground = GAME_HEIGHT - PLAYER_HEIGHT - 50

        if (newY >= ground) {
          newY = ground
          setPlayerVelocity(0)
          setIsJumping(false)
        } else {
          setPlayerVelocity((v) => v + GRAVITY)
        }

        return newY
      })

      // Update obstacles
      setObstacles((prevObstacles) => {
        const newObstacles = prevObstacles
          .map((obs) => ({
            ...obs,
            x: obs.x - GAME_SPEED,
          }))
          .filter((obs) => obs.x > -OBSTACLE_WIDTH)

        // Check if any obstacle was just passed
        prevObstacles.forEach((prevObs) => {
          const wasInFront = prevObs.x >= 100 + PLAYER_WIDTH
          const currentObs = newObstacles.find((o) => o.id === prevObs.id)
          const isNowBehind = currentObs && currentObs.x < 100 + PLAYER_WIDTH

          if (wasInFront && isNowBehind && !prevObs.scored) {
            currentObs.scored = true
            setScore((s) => s + 1)
          }
        })

        // Check collision
        if (checkCollision(playerYRef.current, newObstacles)) {
          setGameOver(true)
        }

        return newObstacles
      })
    }, 1000 / 60) // 60 FPS

    return () => clearInterval(gameLoopRef.current)
  }, [gameStarted, gameOver, checkCollision])

  // Spawn obstacles
  useEffect(() => {
    if (!gameStarted || gameOver) return

    obstacleIntervalRef.current = setInterval(() => {
      setObstacles((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: GAME_WIDTH,
          scored: false,
        },
      ])
    }, OBSTACLE_SPAWN_INTERVAL)

    return () => clearInterval(obstacleIntervalRef.current)
  }, [gameStarted, gameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump])

  return (
    <div className="app">
      <h1>Head Jump Game</h1>
      <div className="game-info">
        <div className="score">Score: {score}</div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

      <div className="game-container" onClick={jump}>
        <div className="ground"></div>

        {/* Player */}
        <div
          className="player"
          style={{
            bottom: `${GAME_HEIGHT - playerY - PLAYER_HEIGHT}px`,
          }}
        >
          <div className="head"></div>
          <div className="body"></div>
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="obstacle"
            style={{
              left: `${obstacle.x}px`,
            }}
          />
        ))}

        {/* Start screen */}
        {!gameStarted && (
          <div className="overlay">
            <h2>Head Jump Game</h2>
            <p>Click or press SPACE to jump over obstacles!</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        )}

        {/* Game over screen */}
        {gameOver && (
          <div className="overlay">
            <h2>Game Over!</h2>
            <p className="final-score">Final Score: {score}</p>
            <button onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>

      <div className="instructions">
        <p>Press SPACE or click to jump</p>
      </div>
    </div>
  )
}

export default App
