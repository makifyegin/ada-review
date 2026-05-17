require('dotenv').config({ override: true })
const { Op } = require('sequelize')
const { Student } = require('./models')

const main = async () => {
  // Simulating req.body — full row objects, not just usernames
  const reqBody = [
    { name: 'A', username: 'akif', password: 'p' }, // already exists
    { name: 'B', username: 'doesnotexist', password: 'p' }, // safe
    { name: 'C', username: 'bob', password: 'p' }, // already exists
    { name: 'D', username: 'newperson', password: 'p' }, // safe
  ]
  const schoolId = 1

  // Extract just the usernames for the IN-query
  const batchUsernames = reqBody.map((s) => s.username)

  // The pre-existence check — one SELECT, returns only usernames already in DB
  const existing = await Student.findAll({
    where: {
      schoolId,
      username: { [Op.in]: batchUsernames },
    },
    attributes: ['username'],
  })

  const existingUsernames = existing.map((row) => row.username)
  console.log('Batch sent:', batchUsernames)
  console.log('Existing in DB:', existingUsernames)

  // Convert to Set for O(1) lookup, then map row by row to errors
  const existingSet = new Set(existingUsernames)

  const errors = []
  reqBody.forEach((student, index) => {
    if (existingSet.has(student.username)) {
      errors.push({
        path: `${index}.username`,
        errorCode: 'ERR_USERNAME_EXISTS',
        message: `Username "${student.username}" already exists for this school.`,
      })
    }
  })

  console.log('\nErrors per row:')
  console.log(JSON.stringify(errors, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
