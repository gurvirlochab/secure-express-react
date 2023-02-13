const express = require('express')
const app = express()
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const prisma = require('./prisma/prisma')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// const prisma = new PrismaClient()

require('dotenv').config()

//Use helmet to set various HTTP headers
/*
Hackers can exploit known vulnerabilities in Express/Node if they see that your site is powered by Express. X-Powered-By: Express is sent in every request coming from Express by default.
*/
app.use(helmet.hidePoweredBy())

/*
Your page could be put in a <frame> or <iframe> without your consent. This can result in clickjacking attacks, among other things. Clickjacking is a technique of tricking a user into interacting with a page different from what the user thinks it is. This can be obtained executing your page in a malicious context, by mean of iframing. In that context a hacker can put a hidden layer over your page. Hidden buttons can be used to run bad scripts. This middleware sets the X-Frame-Options header. It restricts who can put your site in a frame. It has three modes: DENY, SAMEORIGIN, and ALLOW-FROM.
We don’t need our app to be framed.
*/
app.use(
    helmet.frameguard({
        action: 'deny',
    })
)
/*

Cross-site scripting (XSS) is a frequent type of attack where malicious scripts are injected into vulnerable pages, with the purpose of stealing sensitive data like session cookies, or passwords.
The basic rule to lower the risk of an XSS attack is simple: “Never trust user’s input”. As a developer you should always sanitize all the input coming from the outside. This includes data coming from forms, GET query urls, and even from POST bodies. Sanitizing means that you should find and encode the characters that may be dangerous e.g. <, >.
Modern browsers can help mitigating the risk by adopting better software strategies. Often these are configurable via http headers.
The X-XSS-Protection HTTP header is a basic protection. The browser detects a potential injected script using a heuristic filter. If the header is enabled, the browser changes the script code, neutralizing it.
It still has limited support.
*/
app.use(helmet.xssFilter())

/*

Browsers can use content or MIME sniffing to adapt to different datatypes coming from a response. They override the Content-Type headers to guess and process the data. While this can be convenient in some scenarios, it can also lead to some dangerous attacks. This middleware sets the X-Content-Type-Options header to nosniff.
*/
app.use(helmet.noSniff())

/*
Some web applications will serve untrusted HTML for download. Some versions of Internet Explorer by default open those HTML files in the context of your site. This means that an untrusted HTML page could start doing bad things in the context of your pages. This middleware sets the X-Download-Options header to noopen. This will prevent IE users from executing downloads in the trusted site’s context.
*/
app.use(helmet.ieNoOpen())

/*
    If your website can be accessed via HTTPS you can ask user’s browsers to avoid using insecure HTTP. By setting the header Strict-Transport-Security, you tell the browsers to use HTTPS for the future requests in a specified amount of time. This will work for the requests coming after the initial request.
*/
const ninetyDaysInSeconds = 90 * 24 * 60 * 60
app.use(
    helmet.hsts({
        maxAge: ninetyDaysInSeconds,
        force: true,
    })
)
/*
To improve performance, most browsers prefetch DNS records for the links in a page. In that way the destination ip is already known when the user clicks on a link. This may lead to over-use of the DNS service (if you own a big website, visited by millions people…), privacy issues (one eavesdropper could infer that you are on a certain page), or page statistics alteration (some links may appear visited even if they are not). If you have high security needs you can disable DNS prefetching, at the cost of a performance penalty.
*/
app.use(helmet.dnsPrefetchControl())
/*
By setting and configuring a Content Security Policy you can prevent the injection of anything unintended into your page. This will protect your app from XSS vulnerabilities, undesired tracking, malicious frames, and much more. CSP works by defining a whitelist of content sources which are trusted. You can configure them for each kind of resource a web page may need (scripts, stylesheets, fonts, frames, media, and so on…). There are multiple directives available, so a website owner can have a granular control. See HTML 5 Rocks, KeyCDN for more details. Unfortunately CSP is unsupported by older browser.
By default, directives are wide open, so it’s important to set the defaultSrc directive as a fallback. Helmet supports both defaultSrc and default-src naming styles. The fallback applies for most of the unspecified directives.
*/
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'trusted-scripts.com'],
            styleSrc: ["'self'", 'trusted-styles.com'],
            imgSrc: ["'self'", 'trusted-images.com'],
        },
    })
)

/* 
app.use(helmet()) will automatically include all the middleware introduced above, except noCache(), and contentSecurityPolicy(), but these can be enabled if necessary. You can also disable or configure any other middleware individually, using a configuration object.
*/
app.use(
    helmet({
        frameguard: {
            // configure
            action: 'deny',
        },
        contentSecurityPolicy: {
            // enable and configure
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", 'trusted-styles.com'],
            },
        },
        dnsPrefetchControl: false, // disable
    })
)

//each middleware is introduced separately for information purposes. Using the ‘parent’ helmet() middleware is easy to implement in a real project.

// Use cors to configure CORS settings
const whitelist = ['https://example.com', 'https://example.org']
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}
app.use(cors(corsOptions))

// used to parse the incoming requests with JSON payloads and is based upon the bodyparser
app.use(express.json())

// Use rate limiting to prevent DoS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Use bcrypt to hash user passwords
const saltRounds = 10
const plainPassword = 'password123'

var hashPassword = async function () {
    // console.log(bcrypt.hash(plainPassword, saltRounds))
    await bcrypt.hash(plainPassword, saltRounds)
    // console.log(hashPwd)
}
hashPassword()

// Use jsonwebtoken to handle JWT generation and verification
const secret = 'secretkey'
const payload = { userId: 1 }
const options = { expiresIn: '1h' }
const token = jwt.sign(payload, secret, options)

// Verify a token
jwt.verify(token, secret, (err, decoded) => {
    if (err) {
        // Handle error
    }
    //Use the decoded data
})

app.get('/', (req, res) => {
    return res.json({
        message: 'Hi there',
        token,
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
