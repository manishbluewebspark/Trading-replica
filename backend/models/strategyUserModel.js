import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserStrategy = sequelize.define(
    
  'UserStrategy',
  {
     strategyName: {
      type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        set(value) {
        this.setDataValue("strategyName", value ? value.trim() : "");
      }
    },
     strategyDis: {
      type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
    },
  },
  {
    tableName: 'user_strategy',  // ✅ dedicated table

    timestamps: true,
  }
);

export default UserStrategy;
