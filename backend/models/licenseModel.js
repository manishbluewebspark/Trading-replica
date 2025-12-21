import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const License = sequelize.define("License", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
}, {
    tableName: "license",
    timestamps: false,
});

export default License;