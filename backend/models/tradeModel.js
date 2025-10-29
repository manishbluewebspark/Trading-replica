import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Trade = sequelize.define(
  "Trade",
  {
    exchange: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    producttype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tradingsymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrumenttype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    symbolgroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    strikeprice: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    optiontype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expirydate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    marketlot: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    precision: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    multiplier: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tradevalue: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    transactiontype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fillprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fillsize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fillid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Each fill is unique
    },
    filltime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "trades",
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

export default Trade;
