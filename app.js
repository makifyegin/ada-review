require('dotenv').config({ override: true })
const { Student, School } = require('./models')
const { createStudents } = require('./controllers/createStudents')
const { sequelize } = require('./models/database')
const express = require('express')
const ada = express()
const port = 3000

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected')
  })
  .catch((err) => {
    console.error('Database connection failed:', err)
  })

sequelize
  .sync({ force: true })
  .then(() => {
    console.log('Model Synced')
  })
  .catch((err) => {
    console.error('Sync failed:', err)
  })

ada.use(express.json())
ada.get('/', async (req, res) => {
  res.send('Hello World')
})

ada.get('/schools/:schoolId/students', async (req, res) => {
  const students = await Student.findAll({ where: { schoolId: req.params.schoolId } })
  res.send({ students: students })
})

ada.get('/schools', async (req, res) => {
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

ada.post('/schools/:schoolId/students', createStudents)

ada.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
