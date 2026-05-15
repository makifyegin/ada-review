require('dotenv').config({ path: '.env', override: true })

const { sequelize } = require('../models/database')
const { School, Student } = require('../models')

const main = async () => {
  await sequelize.sync({ force: true })
  console.log('Synced')
  const school = await School.create({ name: 'Ada Primary' })

  console.log('Created school', school.id, school.name)
  const school_second = await School.create({ name: 'Ada Secondry' })
  console.log('Created school', school_second.id, school_second.name)

  const student = await Student.create({
    name: 'Akif',
    username: 'makifyegin',
    password: '1234',
    schoolId: school.id,
    createdBy: 1,
  })

  const student2 = await Student.create({
    name: 'Akif2',
    username: 'makifyegin2',
    password: '1234',
    schoolId: school.id,
    createdBy: 1,
  })

  console.log('Created Student', student.id, student.name)
  console.log('Created Student2', student2.id, student2.name)

  const studentsForSchool = await Student.findAll({
    where: { schoolId: school.id },
  })

  console.log('Students found', studentsForSchool.length)

  studentsForSchool.forEach((student) => {
    console.log(`- ${student.id}, ${student.username}`)
  })

  await sequelize.close()
  console.log('Connection closed')
}

main().catch(console.error)
