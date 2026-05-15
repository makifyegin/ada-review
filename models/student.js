const { sequelize } = require("./database")
const { DataTypes } = require("sequelize")


const columns = {
    name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
},
    username: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
},
    password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
},
    passwordResetRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
},
    schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false
},
    createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
}
}


const Student = sequelize.define("Student", columns)

module.exports = Student