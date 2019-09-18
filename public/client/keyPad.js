/*

+-+-+-+-+         +-+-+-+-+
|1|2|3|C|         |1|2|3|4|
+-+-+-+-+         +-+-+-+-+
|4|5|6|D|         |Q|W|E|R|
+-+-+-+-+   =>    +-+-+-+-+
|7|8|9|E|         |A|S|D|F|
+-+-+-+-+         +-+-+-+-+
|A|0|B|F|         |Z|X|C|V|
+-+-+-+-+         +-+-+-+-+


*/
class Keypad {
  constructor() {
    this._keys = new Array(16).fill(false)
    this.keyMap = {
      49: 0x1, //1 -> 1
      50: 0x2, //2 -> 2
      51: 0x3, //3 -> 3
      52: 0xC, //4 -> C
      81: 0x4, //Q -> 4
      87: 0x5, //W -> 5
      69: 0x6, //E -> 6
      82: 0xD, //R -> D
      65: 0x7, //A -> 7
      83: 0x8, //S -> 8
      68: 0x9, //D -> 9
      70: 0xE, //F -> E
      90: 0xA, //Z -> A
      88: 0x0, //X -> 0
      67: 0xB, //C -> B
      86: 0xF, //V -> F
    }
  }

  anyKey() {
    for (let key in this._keys) {
      if (this._keys[key]) {
        return key;
      }
    }
    return false
  }

  isPressed(key) {
    return this._keys[key]
  }

  keyDown(keyEvent) {
    this._keys[this.keyMap[keyEvent.keyCode]] = true;
    //console.log(`key ${keyEvent.keyCode} pressed corresponding to ${this.keyMap[keyEvent.keyCode]}`)
  }

  keyUp(keyEvent) {
    this._keys[this.keyMap[keyEvent.keyCode]] = false;
  }
}