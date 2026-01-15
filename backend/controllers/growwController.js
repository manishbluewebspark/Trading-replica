import axios from "axios";
import User from "../models/userModel.js"



export const growwAppCredential = async (req, res) => {
  try {


    console.log( req.body);
    
    const userId = req.userId; // set by auth middleware

    const { authToken } = req.body;

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: missing userId",
      });
    }

    if (!authToken) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "authToken is required",
      });
    }

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Save/Update
    user.authToken = authToken;
    await user.save();

    return res.json({
      status: true,
      statusCode: 200,
      message: "Groww credential saved successfully",
      data: {
        id: user.id,
        broker: "groww",
        hasToken: !!user.authToken,
      },
    });
  } catch (error) {
    console.error("growwAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to save Groww credentials",
      error: error.message,
    });
  }
};


export const getGrowwAppCredential = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: missing userId",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const authToken = user.authToken || "";

    return res.json({
      status: true,
      statusCode: 200,
      message: authToken ? "Groww credential loaded" : "No Groww credential found",
      data: { authToken },
    });
  } catch (error) {
    console.error("getGrowwAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to fetch Groww credentials",
      error: error.message,
    });
  }
};


export const getGrowwUserDetail = async (req, res) => {
  try {

    // Option 1: frontend se header me
    const growwToken = process.env.GROWW_TOKEN

    // Option 2: DB se (example)
    // const growwToken = req.user.growwToken;

    if (!growwToken) {
      return res.status(400).json({
        status: false,
        message: "Groww access token required",
      });
    }

    const response = await axios.get(
      "https://api.groww.in/v1/user/detail",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Groww user detail fetched successfully",
      data: response.data,
    });

  } catch (error) {
    console.error("Groww API Error:", error?.response?.data || error.message);

    return res.status(500).json({
      status: false,
      message:
        error?.response?.data?.message ||
        "Failed to fetch Groww user detail",
    });
  }
};


export const getGrowwUserMargins = async (req, res) => {
  try {
    // Groww access token
    const growwToken = req.headers.angelonetoken;

    if (!growwToken) {
      return res.status(400).json({
        status: false,
        message: "Groww access token required",
      });
    }

    const response = await axios.get(
      "https://api.groww.in/v1/margins/detail/user",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    const growwData = response.data;

    // ✅ Fund calculation (Groww equivalent of Kite equity.net)
    const availableCash =
      growwData?.payload?.clear_cash || 0;

    

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Funds & margins retrieved successfully",
      data: {
         raw: growwData,              // full Groww response
        availablecash: availableCash // Kite-style fund
      },
    });

  } catch (error) {
    console.error(
      "Groww Margins API Error:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      status: false,
      message:
        error?.response?.data?.message ||
        "Failed to fetch Groww user margins",
    });
  }
};











