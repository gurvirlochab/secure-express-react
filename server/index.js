const express = require('express')
const app = express()

app.get('/',(req,res)=>{
    return res.json({
        message:'Hi there'
    })
})
// use port 3000 unless there exists a pre-configured port
var port = process.env.APP_PORT || 3000;


app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
})