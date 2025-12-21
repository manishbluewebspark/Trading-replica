import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserSession = sequelize.define(
    
  'UserSession',
  {
     userId: {
      type: DataTypes.INTEGER,   // 🔁 changed from UUID
      allowNull: false,
    },
    login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    logout_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    is_active: {
       type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

  },
  {
    tableName: 'user_session',  // ✅ dedicated table

    timestamps: true,
  }
);

export default UserSession;
