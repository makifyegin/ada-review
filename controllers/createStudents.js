const { sequelize } = require('../models/database')
const { Student, School } = require('../models')

const createStudents = async (req, res) => {
  const school = await School.findByPk(req.params.schoolId)
  if (!school) {
    res.status(404).json({ error: 'School not found' })
    return
  }
  const newStudents = req.body
  const createdIds = []
  const errors = []
  const transaction = await sequelize.transaction()
  try {
    for (const student of newStudents) {
      try {
        await sequelize.query('SAVEPOINT saved', { transaction })
        const created = await Student.create(
          {
            schoolId: req.params.schoolId,
            name: student.name,
            username: student.username,
            password: student.password,
            passwordResetRequired: true,
            createdBy: 1,
          },
          { transaction },
        )
        createdIds.push(created.id)
      } catch (error) {
        await sequelize.query('ROLLBACK TO SAVEPOINT saved', { transaction })
        errors.push(error.message)
      }
    }

    if (errors.length > 0) {
      await transaction.rollback()
      res.status(400).json({ errors })
      return
    }
    await transaction.commit()
    res.status(201).json({ created: createdIds })
  } catch (error) {
    await transaction.rollback()

    res.status(400).json({ error: error.message })
    return
  }
}

module.exports = { createStudents }
