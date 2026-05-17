const { DataTypes } = require('sequelize')
const { Database } = require('./database')

const School = Database.define('School', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
})

module.exports = School
