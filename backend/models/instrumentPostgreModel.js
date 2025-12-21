// models/instrument.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

  const Instrument = sequelize.define(
    "Instrument",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
       instrumenttype: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiry: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      lotsize: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "1",
      },
      exch_seg: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      SyNum: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      syType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
       nameStrickType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
    },
    {
      tableName: "Instruments",
      timestamps: true, // adds createdAt/updatedAt like Mongoose
    }
  );

  export default Instrument;


