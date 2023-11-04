const express = require('express')
const app = express()
const port = 5000

app.get('/', (req, res) => {
  res.send('Hunger-Relief is available here')
})

app.listen(port, () => {
  console.log(`Hunger-Relief listening on port ${port}`)
})