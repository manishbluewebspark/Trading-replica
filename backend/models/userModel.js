import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
     validate: {
    len: [10, 15], // ✅ min 10, max 15 characters
  },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  isChecked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  angeloneId: {
  type: DataTypes.STRING,
  allowNull: true,
  unique: true
},
// brokerType:{
// type: DataTypes.TEXT,
//   allowNull: true,
// },
authToken: {
  type: DataTypes.TEXT,
  allowNull: true,
},
feedToken: {
  type: DataTypes.TEXT,
  allowNull: true,
},
refreshToken: {
  type: DataTypes.TEXT,
  allowNull: true,
}
}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
