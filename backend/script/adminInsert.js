import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

import orderModel from '../models/orderModel.js';
import tradeModel from '../models/tradeModel.js';






export async function seedAdmin() {
  try {

    const obj = {
    firstName:"admin",
    lastName:"admin",
    email:"admin@gmail.com",
    username:"admin",
    phoneNumber:9999999999,
    password:"Admin@1234",
    role:"admin"
      
    } 

    const existing = await User.findOne({
      where: { email: obj.email },
    });

    const passwordHash = await bcrypt.hash(obj.password, 10);

    obj.password = passwordHash

    if (!existing) {
        
      await User.create(obj);

      console.log('Admin user created:');

    } else {
      
      console.log('🔁 Admin Credential Already Created:');
    }

  } catch (err) {

    console.error(' Seed admin failed:', err.message);
    
  }
}



