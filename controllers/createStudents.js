const { Database } = require('../models/database')
const { Student, School } = require('../models')
const { Sequelize, Op } = require('sequelize')
const { formatValidationErrors } = require('./formatValidationErrors')
const { reportError } = require('./reportError')

const fromEnv = parseInt(process.env.MAX_STUDENTS_PER_REQUEST, 10)
const MAX_STUDENTS = Number.isNaN(fromEnv) ? 50 : fromEnv

const createStudents = async (req, res, preflight = true) => {
  try {
    // 1. School exists?
    const school = await School.findByPk(req.params.schoolId)
    if (!school) {
      res.status(404).json({
        errors: [
          {
            path: 'schoolId',
            errorCode: 'ERR_SCHOOL_NOT_FOUND',
            message: 'School not found.',
            location: 'path',
          },
        ],
      })
      return
    }

    // 2. Shape: must be a non-empty array
    if (!Array.isArray(req.body)) {
      res.status(400).json({
        errors: [
          {
            path: '.',
            errorCode: 'ERR_INVALID_BODY',
            message: 'Request body must be an array of students.',
            location: 'body',
          },
        ],
      })
      return
    }
    if (req.body.length === 0) {
      res.status(400).json({
        errors: [
          {
            path: '.',
            errorCode: 'ERR_EMPTY_BATCH',
            message: 'Request body must contain at least one student.',
            location: 'body',
          },
        ],
      })
      return
    }
    if (req.body.length > MAX_STUDENTS) {
      res.status(400).json({
        errors: [
          {
            path: '.',
            errorCode: 'ERR_TOO_MANY_STUDENTS',
            message: `Cannot create more than ${MAX_STUDENTS} students in one request.`,
            location: 'body',
          },
        ],
      })
      return
    }

    // 3. In-batch duplicate detection — O(N), no DB
    const usernameTracker = new Set()
    const duplicateUsernames = new Set()
    for (const student of req.body) {
      if (usernameTracker.has(student.username)) {
        duplicateUsernames.add(student.username)
      } else {
        usernameTracker.add(student.username)
      }
    }
    if (duplicateUsernames.size > 0) {
      const dupErrors = [...duplicateUsernames].map((username) => ({
        path: 'username',
        errorCode: 'ERR_DUPLICATE_IN_BATCH',
        message: `Username "${username}" is duplicated in the batch.`,
        location: 'body',
      }))
      res.status(400).json({ errors: dupErrors })
      return
    }

    // 4. Pre-validate every row in JS via Student.build().validate() — no DB
    const validationErrors = []
    for (const [index, studentData] of req.body.entries()) {
      try {
        await Student.build({
          ...studentData,
          schoolId: req.params.schoolId,
          passwordResetRequired: true,
          createdBy: 1,
        }).validate()
      } catch (err) {
        if (err instanceof Sequelize.ValidationError) {
          const formatted = formatValidationErrors(err, `${index}.`, {
            username: studentData.username,
          })
          validationErrors.push(...formatted.errors)
        } else {
          throw err
        }
      }
    }
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors })
      return
    }

    // 5. NEW — Pre-existence check: one SELECT, returns conflicting usernames
    const existing = await Student.findAll({
      where: {
        schoolId: req.params.schoolId,
        username: { [Op.in]: req.body.map((s) => s.username) },
      },
      attributes: ['username'],
    })
    const existingSet = new Set(existing.map((row) => row.username))

    if (existingSet.size > 0) {
      const conflictErrors = []
      req.body.forEach((student, index) => {
        if (existingSet.has(student.username)) {
          conflictErrors.push({
            path: `${index}.username`,
            errorCode: 'ERR_USERNAME_EXISTS',
            message: `Username "${student.username}" already exists for this school.`,
            location: 'body',
          })
        }
      })
      res.status(400).json({ errors: conflictErrors })
      return
    }

    // 6. All checks passed — open transaction and bulkCreate
    const transaction = await Database.transaction()
    try {
      const records = req.body.map((student) => ({
        schoolId: req.params.schoolId,
        name: student.name,
        username: student.username,
        password: student.password,
        passwordResetRequired: true,
        createdBy: 1,
      }))

      const created = await Student.bulkCreate(
        records,
        {
          transaction,
          validate: true,
          returning: true,
        },
        { batchSize: 1000 },
      )
      const createdIds = created.map((row) => row.id)

      if (preflight) {
        await transaction.rollback()
        res.status(200).json({ verified: createdIds })
      } else {
        await transaction.commit()
        res.status(201).json({ created: createdIds })
      }
    } catch (err) {
      try {
        await transaction.rollback()
      } catch (_) {}

      // Race-condition fallback: someone inserted a conflicting username
      // between our pre-existence check and the bulkCreate.
      if (err instanceof Sequelize.UniqueConstraintError) {
        err.errors = err.errors.filter(
          (e) => !(e.path === 'schoolId' && e.validatorKey === 'not_unique'),
        )
        const formatted = formatValidationErrors(err, '', {})
        res.status(409).json({ errors: formatted.errors })
        return
      }
      throw err
    }
  } catch (error) {
    reportError(error)
    res.status(500).send()
  }
}

module.exports = { createStudents }
