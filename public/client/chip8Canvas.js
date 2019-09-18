class Chip8Canvas {
  constructor(canvas, scale = 1, bgColor = '#48703d', fgColor = '#b8eaab') {
    // this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.width = 64
    this.height = 32
    this.scale = scale // scale of 2 will make pixels 2x2 rects instead of single pixels
    this.bgColor = bgColor
    this.fgColor = fgColor
    this.pixelData = new Array(this.width * this.height).fill(0);
  }

  render() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.context.fillStyle = [this.bgColor, this.fgColor][this.pixelData[x + this.width * y]]
        this.context.fillRect(x * this.scale, y * this.scale, this.scale, this.scale)
      }
    }
  }

  clearScreen() {
    this.pixelData.fill(0)
    //this._context.fillStyle = this.bgColor
    //this._context.fillRect(0, 0, this.width * this.scale, this.height * this.scale)
  }

  // [row1, row2, rowN  ]
  drawSprite(x, y, sprite) {
    let collision = false;
    //console.log(`${sprite}`)
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r]
      for (let c  = 0; c < 8; c++) {
        const pixel = row >> (7 - c) & 0x1
        const location = x + c + ((y + r) * this.width)
        // if a pixel is turned off as a result of drawing in XOR mode, a collision flag is set
       if (pixel === 1 && this.pixelData[location] === 1) {
         collision = true
       }
       this.pixelData[location] ^= pixel
      }
    }
    return collision ? 1 : 0
  }
}