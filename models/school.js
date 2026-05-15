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
        }

    }
)

module.exports = School