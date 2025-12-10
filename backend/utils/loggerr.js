import logger from "../common/logger.js";

// SUCCESS Log (info)
export function logSuccess(req, extraData = {}) {
  logger.info("API Request Completed", {
    url: req.originalUrl,
    method: req.method,
    status: true,
    userId: req?.userId || null,
    ...extraData
  });
}

// ERROR Log (error)
export function logError(req, err, extraData = {}) {
  logger.error("API Request Failed", {
    url: req.originalUrl,
    method: req.method,
    status: false,
    userId: req?.userId || null,
    error: err.message,
    stack: err.stack || null,
    ...extraData
  });
}