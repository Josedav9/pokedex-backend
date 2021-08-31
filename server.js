const dotenv = require('dotenv')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const colors = require('colors')
//Load environment variables

dotenv.config({ path: './config/config.env' })

//Load route files

//
const app = express()

app.use(express.json())

// Dev logging midleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.static('public'))

//Enable CORS
app.use(cors())

//Mount routers

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      .yellow.bold
  )
)

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  //Close server and exit process
  server.close(() => {
    process.exit(1)
  })
})
