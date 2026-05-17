const { Database } = require('./database')
const { DataTypes } = require('sequelize')

const columns = {
  name: {
    type: DataTypes.STRING,
    allowNull: false,

    validate: { notEmpty: true },
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  passwordResetRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}

const Student = Database.define('Student', columns, {
  indexes: [{ unique: true, fields: ['username', 'schoolId'] }],
  hooks: {
    beforeCreate: (student, options) => {
      if (options.discardPassword) {
        student.password = '[discarded]'
      }
    },
  },
})

module.exports = Student
