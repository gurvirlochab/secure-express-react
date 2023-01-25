const express = require('express')
const app = express()
const cors = require('cors')
const helmet = require('helmet')
const helmetCSP = require('helmet-csp')
const rateLimit = require('express-rate-limit')
const prisma = require('./prisma/prisma')

// const prisma = new PrismaClient()

require('dotenv').config()

//Use helmet to set various HTTP headers
app.use(helmet())

// Use cors to configure CORS settings
app.use(cors())

// Use helmet-csp to set the Content-Security-Policy header
app.use(
    helmetCSP({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'trusted-scripts.com'],
            styleSrc: ["'self'", 'trusted-styles.com'],
            imgSrc: ["'self'", 'trusted-images.com'],
        },
    })
)

app.use(express.json())

// Use rate limiting to prevent DoS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)


app.get('/', (req, res) => {
    return res.json({
        message: 'Hi there',
    })
})

app.post('/users', async (req, res) => {
    try {
        const { name, games } = req.body

        // games is an array of string | string[]

        const newUser = await prisma.user.create({
            data: {
                name, // name is provided by the request body
                games: {
                    // create or connect means if the game existed, we will use the old one
                    // if not, we will create a new game
                    connectOrCreate: games.map((game) => ({
                        where: {
                            name: game,
                        },
                        create: {
                            name: game,
                        },
                    })),
                },
            },
        })

        res.json(newUser)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            message: 'Internal Server Error',
        })
    }
})
app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany()

        res.json(users)
    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong',
        })
    }
})
// use port 3000 unless there exists a pre-configured port
var port = process.env.APP_PORT || 3000

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
