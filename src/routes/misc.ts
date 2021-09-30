import { getHealthCheck } from "../controllers/misc";
import * as express from "express";


export const miscRouter = express.Router();

miscRouter.route("/").get(getHealthCheck);