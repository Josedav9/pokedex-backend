/**
 * Checks the status of the server
 * @route GET /api/v1/health/
 * @access public
 */

/**
 * Checks the status of the server
 * @route GET /api/v1/health/
 * @access public
 */
import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../utils/errorResponse";

export const getHealthCheck = async (
    req: Request,
    res: Response,
    next: NextFunction) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Server working OK'
        })
    }
    catch (e) {
        return next(new ErrorResponse('Unhealthy server', 500))
    }
}