import User from '../models/userModel.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: "user" },
        });

        return res.status(200).json({
            status: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const updateUserProfile = async function (req,res,next) {
    try {

    let { id, firstName, lastName, email, phoneNumber, brokerName } = req.body;

     id = Number(id)
    

    // ✅ 1. Validate inputs
    if (!id) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "User ID is required",
        data: null,
      });
    }

     // ✅ 2. Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
      });
    }

    // ✅ 3. Update fields only if provided
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.email = email ?? user.email;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.brokerName = brokerName ?? user.brokerName;
   
    // // ✅ 4. If a file (image) was uploaded using multer
    // if (req.file) {
    //   user.image = req.file.originalname; // or save file path if stored locally/cloud
    // }

    // ✅ 5. Save updated user
    await user.save();

    console.log(user,'ffffffr');
    

    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile updated successfully",
      user,
    });
    

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

export const getUserById = async (req, res) => {
  try {

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};


export const userLogout = async (req, res) => {
  try {



    return res.status(200).json({
      status: true,
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};