const express = require("express")

const ada = express()

const port = 3000


ada.get('/', (req, res) =>{
    res.send('Hello World')
})

ada.get('/schools/:schoolId/students', (req, res)=>{
    res.send({schoolId: req.params.schoolId})
})

ada.listen(port, ()=>{
    console.log(`Example app listening on port ${port}`)
})