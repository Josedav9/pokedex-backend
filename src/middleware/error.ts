import { ErrorResponse } from "../utils/errorResponse";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };

  error.message = err.message;

  //Log to console for developer
  console.log(err.stack.red);

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};
