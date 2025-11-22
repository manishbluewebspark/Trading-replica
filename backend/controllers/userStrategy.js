// controllers/strategyUserController.js
import StrategyUserModel from "../models/strategyUserModel.js";

// 🔹 Helper: uniform success response
const successResponse = (res, message, data = null, code = 200) => {
  return res.status(code).json({
    status: true,
    statusCode: code,
    message,
    data,
  });
};

// 🔹 Helper: uniform error response
const errorResponse = (res, message, code = 500, error = null) => {
  return res.status(code).json({
    status: false,
    statusCode: code,
    message,
    data: null,
    error,
  });
};

export const getAllStrategies = async (req, res) => {
  try {
    const strategies = await StrategyUserModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "successfully fetched data", strategies);
  } catch (error) {
    console.error("getAllStrategies error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const getStrategyById = async (req, res) => {
  try {
    const { id } = req.params;

    const strategy = await StrategyUserModel.findByPk(id);

    if (!strategy) {
      return errorResponse(res, "Strategy not found", 404);
    }

    return successResponse(res, "successfully fetched data", strategy);
  } catch (error) {
    console.error("getStrategyById error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const createStrategy = async (req, res) => {
  try {
    const { strategyName, strategyDis } = req.body;

    if (!strategyName || !strategyName.trim()) {
      return errorResponse(res, "strategyName is required", 400);
    }

    console.log(req.body);
    

    const newStrategy = await StrategyUserModel.create({
      strategyName: strategyName.trim(),
      strategyDis: strategyDis?.trim() || "",
    });

    return successResponse(res, "Strategy created successfully", newStrategy, 201);
  } catch (error) {
    console.error("createStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const updateStrategy = async (req, res) => {
  try {
   
    const { strategyName, strategyDis,id } = req.body;

    const strategy = await StrategyUserModel.findByPk(id);

    if (!strategy) {
      return errorResponse(res, "Strategy not found", 404);
    }

    if (strategyName !== undefined) strategy.strategyName = strategyName.trim();
    if (strategyDis !== undefined) strategy.strategyDis = strategyDis.trim();

    await strategy.save();

    return successResponse(res, "Strategy updated successfully", strategy);
  } catch (error) {
    console.error("updateStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await StrategyUserModel.destroy({ where: { id } });

    if (deleted === 0) {
      return errorResponse(res, "Strategy not found or already deleted", 404);
    }

    return successResponse(res, "Strategy deleted successfully");
  } catch (error) {
    console.error("deleteStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};
