const {DataTypes} = require("sequelize")
const {sequelize} = require("./database")

const School = sequelize.define("School",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty: true
            }
        },
        postCode: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        testBoolean: DataTypes.BOOLEAN

    }
)

module.exports = School