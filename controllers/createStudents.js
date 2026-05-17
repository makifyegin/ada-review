const { Database } = require('../models/database')
const { Student, School } = require('../models')
const { Sequelize } = require('sequelize')
const { formatValidationErrors } = require('./formatValidationErrors')
const { reportError } = require('./reportError')

const fromEnv = parseInt(process.env.MAX_STUDENTS_PER_REQUEST, 10)
const MAX_STUDENTS = Number.isNaN(fromEnv) ? 50 : fromEnv

const createStudents = async (req, res, preflight = true) => {
  try {
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

    // 1. Detect in-batch duplicates with a single O(N) pass — pure JS, before any DB work
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
      const dupErrors = []
      for (const username of duplicateUsernames) {
        dupErrors.push({
          path: 'username',
          errorCode: 'ERR_DUPLICATE_IN_BATCH',
          message: `Username "${username}" is duplicated in the batch.`,
          location: 'body',
        })
      }
      res.status(400).json({ errors: dupErrors })
      return
    }

    // 2. Pre-validate every row with Student.build().validate() — still pure JS, no DB
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

    // 3. All client-side checks passed. Now open the transaction and insert.
    const createdIds = []
    const errors = []
    const transaction = await Database.transaction()

    try {
      for (const [index, student] of req.body.entries()) {
        try {
          await Database.query('SAVEPOINT saved', { transaction })

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
          await Database.query('ROLLBACK TO SAVEPOINT saved', { transaction })
          if (error instanceof Sequelize.ValidationError) {
            // Composite unique on (username, schoolId) produces TWO errors when violated —
            // one for username, one for schoolId. The schoolId one is noise, filter it.
            error.errors = error.errors.filter(
              (e) => !(e.path === 'schoolId' && e.validatorKey === 'not_unique'),
            )
            const formatted = formatValidationErrors(error, `${index}.`, {
              username: student.username,
            })
            errors.push(...formatted.errors)
          } else {
            throw error
          }
        }
      }

      if (errors.length > 0) {
        await transaction.rollback()
        res.status(400).json({ errors })
        return
      }

      if (preflight) {
        await transaction.rollback()
        res.status(200).json({ verified: createdIds })
      } else {
        await transaction.commit()
        res.status(201).json({ created: createdIds })
      }
    } catch (error) {
      try {
        await transaction.rollback()
      } catch (_) {}
      throw error
    }
  } catch (error) {
    reportError(error)
    res.status(500).send()
  }
}

module.exports = { createStudents }
