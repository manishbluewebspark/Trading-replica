import User from '../models/userModel.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: "user" },
        });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};