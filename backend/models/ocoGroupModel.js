import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // adjust path

const OcoGroup = sequelize.define(
  "OcoGroup",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ===============================
    // Relations
    // ===============================
    userId: {
     type: DataTypes.INTEGER,   
      allowNull: false,
    },
    broker: {
      type: DataTypes.ENUM(
        "angelone",
        "kite",
        "fyers",
        "upstox",
        "finvasia",
        "groww"
      ),
      allowNull: false,
    },

    // ===============================
    // Instrument info
    // ===============================
    symbol: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    exchange: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // ===============================
    // Order mapping
    // ===============================
    buyOrderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "buy_order_id",
    },

    targetOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "target_order_id",
    },

    stoplossOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "stoploss_order_id",
    },

    // ===============================
    // Trade info
    // ===============================
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "COMPLETED","FAILD"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    winner: {
      type: DataTypes.ENUM("TARGET", "STOPLOSS"),
      allowNull: true,
    },
  },
  {
    tableName: "oco_groups",
    timestamps: true,
    underscored: true,
  }
);

export default OcoGroup;
