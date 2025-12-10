import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define(
  "Order",
  {
      id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
    userId: {
      type: DataTypes.INTEGER,   // 🔁 changed from UUID
      allowNull: false,
    },
    userNameId: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
  if (value === null || value === undefined) {
    this.setDataValue("userNameId", null);
  } else {
    this.setDataValue("userNameId", String(value).trim());
  }
}
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
      defaultValue: "PENDING",
      set(value) {
        this.setDataValue("status", value ? value.toUpperCase() : null);
      }
    },
    orderstatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orderstatuslocaldb: {
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
    buyvalue:{
        type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    buyprice:{
       type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    buysize:{
       type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    pnl:{
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    fillid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filltime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    broker: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    angelOneToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     angelOneSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  buyTime: {
    type: DataTypes.STRING,
    allowNull: true,
   },
    buyOrderId: {
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


          