import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define(
  "Order",
  {
    userId: {
      type: DataTypes.INTEGER,   // 🔁 changed from UUID
      allowNull: false,
    },
    variety: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ordertype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    producttype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    totalPrice:{
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    triggerprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actualQuantity:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    disclosedquantity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    squareoff: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    stoploss: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    trailingstoploss: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tradingsymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactiontype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    exchange: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    symboltoken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrumenttype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    strikeprice: {
      type: DataTypes.FLOAT,
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
    lotsize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelsize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    averageprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    filledshares: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unfilledshares: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'pending'
    },
    orderstatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatetime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    exchtime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    exchorderupdatetime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentorderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ordertag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uniqueorderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    //  traded schema value 
    tradedValue:{
       type: DataTypes.FLOAT,
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
    tableName: "orders",
    timestamps: true,
  }
);

export default Order;


          