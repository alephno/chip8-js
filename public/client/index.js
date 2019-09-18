const canvas = document.getElementById('chip8-canvas')
const gamesList = document.getElementById('games-select')
const startStopButton = document.getElementById('start-stop-button')
const stepButton = document.getElementById('step-button')
const resetButton = document.getElementById('reset-button')

const scale = 8
canvas.width = 64 * scale
canvas.height = 32 * scale
let running = false

const chip8Canvas = new Chip8Canvas(canvas, scale)
const keypad = new Keypad()
const chip8 = new Chip8(chip8Canvas, keypad)
let currentGame = null

window.addEventListener('keydown', keypad.keyDown.bind(keypad), false)
window.addEventListener('keyup', keypad.keyUp.bind(keypad), false)

const createGameOption = function(game) {
  const option = document.createElement('option')
  option.setAttribute('value', game)
  option.appendChild(document.createTextNode(game))
  return option;
}

const getGamesList = function() {
  const request = new XMLHttpRequest()
  request.open('GET', '/games')
  request.responseType = 'json'
  request.onload = function() {
    if (request.response.games) {
      request.response.games.forEach((game) => {
        gamesList.appendChild(createGameOption(game))
      })
    }
  }
  request.send()
}

const onGameSelected = function() {
  const game = gamesList.value
  const request = new XMLHttpRequest()
  request.open('GET', '/games/' + game)
  request.responseType = 'arraybuffer'
  request.onload = function() {
    const data = request.response
    if (data) {
      running = false
      currentGame = new Uint8Array(data)
      chip8.reset()
      chip8Canvas.clearScreen()
      chip8.loadProgram(currentGame)
    }
  }
  request.send()
}

startStopButton.onclick = function(event) {
  running = !running
  event.target.innerHTML = running ? "Stop" : "Start"
  emulate()
}

resetButton.onclick = function() {
  if (currentGame) {
    chip8.reset()
    chip8.loadProgram(currentGame)
    chip8Canvas.clearScreen()
  }
}

const emulate = function() {
  if (running) {
    const time = performance.now();
    chip8.executeInstruction()
    setTimeout(emulate, 33 - performance.now() - time)
  }
}

stepButton.onclick = () => chip8.executeInstruction()

getGamesList()
gamesList.onchange = onGameSelected

const render = () => {
  const time = performance.now()
  chip8Canvas.render()
  setTimeout(render, 33 - performance.now() - time)
}

chip8Canvas.clearScreen()
render()