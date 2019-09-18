class Chip8 {
  constructor(renderer, keypad) {
    this.renderer = renderer
    this.keypad = keypad
    // referred to as V0 to VF, VF is the carry flag
    this.registers = new Array(16)
    this.I = 0 // index register
    this.pc = 0 // program counter
    /*
    +---------------+= 0xFFF (4095) End of Chip-8 RAM
    |               |
    |               |
    |               |
    |               |
    |               |
    | 0x200 to 0xFFF|
    |     Chip-8    |
    | Program / Data|
    |     Space     |
    |               |
    |               |
    |               |
    +- - - - - - - -+= 0x600 (1536) Start of ETI 660 Chip-8 programs
    |               |
    |               |
    |               |
    +---------------+= 0x200 (512) Start of most Chip-8 programs
    | 0x000 to 0x1FF|
    | Reserved for  |
    |  interpreter  |
    +---------------+= 0x000 (0) Start of Chip-8 RAM
    */
    this.memory = new Array(4096)
    /*
    * The Chip 8 has a 64 x 32 display where each pixel is either 1 or 0.
    * Drawing is done in XOR mode and if a pixel is turned off as a result of
    * the draw call, VF is set. This is used for collsion detection.
    */
    this.gfx = new Array(64 * 32)
    // timers count down to 0 when above 0 at a rate of 60hz
    this.delayTimer = 0
    this.soundTimer = 0

    this.stack = new Array(16)
    this.sp = 0

    this.keys = new Array(16)

    this.reset()
  }

  reset() {
    this.memory.fill(0)
    this.registers.fill(0)

    const font = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ]

    // insert the font sprites into the start of the interpreter's section of memory, which is just address 0
    this.memory.splice(0, font.length, ...font)
    // start pc at the start of the program area in memory
    this.pc = 0x200
  }

  loadProgram(program) {
    // program memory starts at 0x200
    this.memory.splice(0x200, program.length, ...program)
  }

  executeInstruction() {
    const op = this.memory[this.pc] << 8 | this.memory[this.pc + 1]
    const code = (op & 0xF000) >> 12
    const x = (op & 0x0F00) >> 8
    const y = (op & 0x00F0) >> 4
    const n = op & 0x000F
    const nn = op & 0x00FF
    const nnn = op & 0x0FFF

    //console.log(`op:${op.toString(16)} at pc:${this.pc}. op: ${code}, x: ${x}, y:${y}, n:${n}, nn:${nn}, nnn:${nnn}`);

    this.pc += 2;
    if (this.delayTimer > 0) { this.delayTimer-- }
    if (this.soundTimer > 0) { this.soundTimer-- }

    switch (code) {
      case 0x0:
        switch (nn) {
          case 0xE0: // clear the screen
            this.renderer.clearScreen()
          break;
          case 0xEE: { // return from subroutine
            this.sp--;
            this.pc = this.stack.pop();
          }
          break;
          default: // Sys nnn (as addr). This instruction is to make system calls on the old computers that
                   // used to run chip8. It is ignored by modern interpreters.
          break;
        }
        break;
      case 0x1: this.pc = nnn; // goto to nnn
        break;
      case 0x2: { // call at nnn
        this.stack.push(this.pc);
        this.sp++;
        this.pc = nnn;
      }
        break;
      case 0x3: // xnn skip next instruction if Vx equals nn
        this.pc += this.registers[x] === nn ? 2 : 0;
        break;
      case 0x4: // xnn skip next isntruction if Vx doesn't equal nn
        this.pc += this.registers[x] === nn ? 0 : 2;
        break;
      case 0x5: // xy0 skip next instruction if Vx equals Vy
        this.pc += this.registers[x] === this.registers[y] ? 2 : 0;
        break;
      case 0x6: // xnn sets Vx to nn
        this.registers[x] = nn;
        break;
      case 0x7: { // xnn adds nn to Vx, carry flag not changed. If Vx + nn is greater than 255, the value wraps
        this.registers[x] += nn;
        if (this.registers[x] > 0xFF) {
          this.registers[x] &= 0xFF
        }
      }
        break;
      case 0x8: // Maths and Bitops
        switch (n) {
          case 0x0:// Vx = Vy
            this.registers[x] = this.registers[y];
            break;
          case 0x1: // Vx = Vx | Vy
            this.registers[x] |= this.registers[y];
            break;
          case 0x2: // Vx = Vx & Vy
            this.registers[x] &= this.registers[y];
            break;
          case 0x3: // Vx = Vx ^ Vy
            this.registers[x] ^= this.registers[y];
            break;
          case 0x4: { // Vx += Vy, carry flag is set
            this.registers[x] += this.registers[y];
            this.registers[0xF] = this.registers[x] >> 0xFF;
            this.registers[x]  = this.registers[x] & 0xFF;
          }
            break;
          case 0x5: { // Vx -= Vy, carry flag is set
            this.registers[0xF] = this.registers[x] > this.registers[y] ? 1 : 0;
            this.registers[x] -= this.registers[y];
            // no change if there was no overflow, +256 if there was
            this.registers[x] &= 0xFF;
          }
          break;
          case 0x6: { // shift Vx right, set carry flag
            this.registers[0xF] = this.registers[x] & 0x1;
            this.registers[x] >>= 1;
          }
            break;
          case 0x7: { // Vx = Vy - Vx, set carry flag
            this.registers[0xF] = this.registers[y] > this.registers[x] ? 1 : 0;
            this.registers[x] = this.registers[y] - this.registers[x];
            this.registers[x] &= 0xFF;
          }
            break;
          case 0xE: { // Shift Vx left by 1, set carry flag
            this.registers[0xF] = this.registers[x] & 0x80;
            this.registers[x] <<= 1;
            this.registers[x] &= 0xFF;
           }
            break;
        }
        break;
      case 0x9: // xy0 skip next instruction if Vx doesn't equal Vy
        this.pc += this.registers[x] === this.registers[y] ? 0 : 2;
        break;
      case 0xA: // nnn sets I to nnn
        this.I = nnn;
        break;
      case 0xB: // nnn jumps to address nnn + V0
        this.pc += nnn + this.registers[0];
        break;
      case 0xC: // xnn sets Vx to a random number & nn
        this.registers[x] = (Math.random() * 0xFF) & nn
        break;
      case 0xD: {/*Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
                  and a height of N pixels. Each row of 8 pixels is read as bit-coded starting
                  from memory location I; I value doesn’t change after the execution of this
                  instruction. As described above, VF is set to 1 if any screen pixels are
                  flipped from set to unset when the sprite is drawn, and to 0 if that doesn’t happen */
        this.registers[0xF] = this.renderer.drawSprite(
          this.registers[x],
          this.registers[y],
          this.memory.slice(this.I, this.I + n));
        }
        break;
      case 0xE: // x9E or xA1 skip next instruction if a key is or isnt pressed
        switch (nn) {
          case 0x9E:
            this.pc += this.keypad.isPressed(this.registers[x]) ? 2 : 0;
            break;
          case 0xA1:
            this.pc += this.keypad.isPressed(this.registers[x]) ? 0 : 2;
            break;
        }
        break;
      case 0xF:
        switch (nn) {
          case (0x07): // store delay timer into Vx
            this.registers[x] = this.delayTimer;
            break;
          case (0x0A): { // wait for a keypress and store in Vx
            const key = this.keypad.anyKey()
            if (key) {
              this.registers[x] = key;
            } else {
              this.pc -= 2; // do not go to the next instruction
            }
          }
            break;
          case (0x15): // load Vx into the delay timer
            this.delayTimer = this.registers[x];
            break;
          case (0x1E): // add Vx to I, do no set carry
            this.I += this.registers[x];
            break;
          case (0x29): // set I to location of the digit for Vx
            this.I = this.registers[x] * 5;
            break;
          case (0x33): { // load BCD representation of Vx in memory at address I
            this.memory[this.I] = Math.floor(this.registers[x] / 100);
            this.memory[this.I + 1] = Math.floor((this.registers[x] / 10) % 10 );
            this.memory[this.I + 2] = Math.floor((this.registers[x] % 100) % 10);
          }
          break;
          case (0x55): { // store registers V0 through Vx in memory at address I
            for (let i = 0; i <= x; i++) {
              this.memory[this.I + i] = this.registers[i];
            }
            this.I += x + 1
          }
            break;
          case (0x65): { // load registers V0 through Vx from memory at address I
            for (let i = 0; i <= x; i++) {
              this.registers[i] = this.memory[this.I + i];
            }
            this.I += x + 1
          }
            break;
        }
        break;
        default:
          console.error(`Unkown opcode:${op} encountered at PC:${this.pc - 2}`);
    }
  }
}