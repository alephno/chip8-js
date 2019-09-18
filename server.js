const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const gamesDir = path.join(__dirname, 'public/c8games')
const port = 3000

app.use(express.static('public/client'));
app.use('/games', express.static(gamesDir))


// allow user to get a list of all games on the server
app.get('/games', (req, res) => {
  fs.readdir(gamesDir, (err, files) => {
    if (err) {
      res.status(500)
      res.send("The server failed to load any games.")
    } else {
      res.send({ games: files })
    }
  })
})

// return the specific game requested
app.get('/games/:game', (req, res) => {
  res.sendFile(`${gamesDir}/${req.params.game}`)
})

app.listen(port, () => console.log(`Server listening on port ${port}...`))
