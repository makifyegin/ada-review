const School = require('./school') // looks for models/school.js ✅
const Student = require('./student') // looks for models/student.js ✅

School.hasMany(Student, { foreignKey: 'schoolId' })
Student.belongsTo(School, { foreignKey: 'schoolId' })

module.exports = { School, Student }
