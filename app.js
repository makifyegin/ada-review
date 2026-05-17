require('dotenv').config({ override: true })
const { Student, School } = require('./models')
const { createStudents } = require('./controllers/createStudents')
const { Database } = require('./models/database')
const express = require('express')
const ada = express()
const port = 3000

Database.authenticate()
  .then(() => {
    console.log('Database connected')
  })
  .catch((err) => {
    console.error('Database connection failed:', err)
  })

Database.sync({ force: true })
  .then(() => {
    console.log('Model Synced')
  })
  .catch((err) => {
    console.error('Sync failed:', err)
  })

ada.use(express.json())
ada.use((req, res, next) => {
  req.user = { id: 1 }
  next()
})
ada.get('/', async (req, res) => {
  res.send('Hello World')
})

ada.get('/schools/:schoolId/students', async (req, res) => {
  const students = await Student.findAll({ where: { schoolId: req.params.schoolId } })
  res.send({ students: students })
})

ada.get('/schools', async (req, res) => {
  console.log('req.user.id is:', req.user.id)
  const schools = await School.findAll()
  res.send({ schools: schools })
})

ada.post('/school', async (req, res) => {
  const school = await School.findOne({ where: { name: req.body.name } })

  if (school) {
    res.status(409).json({ error: 'School with that name already exists' })
    return
  }
  const created = await School.create({
    name: req.body.name,
  })
  res.status(201).json({ created: created })
})

ada.post('/schools/:schoolId/students', (req, res) => {
  const isPreflight = req.query.preflight === 'true'
  return createStudents(req, res, isPreflight)
})

ada.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
