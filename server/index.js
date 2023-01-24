const express = require('express')
const app = express()
const prisma = require('./prisma/prisma')

// const prisma = new PrismaClient()

require('dotenv').config()

app.use(express.json())

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
