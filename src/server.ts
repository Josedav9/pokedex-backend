import * as dotenv from "dotenv";
import * as express from "express";
import * as morgan from "morgan";
import * as cors from "cors";
import * as colors from "colors";
import { errorHandler } from "./middleware/error";
import { ErrorResponse } from "./utils/errorResponse";

//Load environment variables
dotenv.config();

//Load route files
import { router } from "./routes/pokemons";

// Create express app
const app = express();

app.use(express.json());

// Dev logging midleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.static("public"));

//Enable CORS
app.use(cors());

//Mount routers
app.use("/api/v1/pokemon", router);

//Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    colors.yellow.bold(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: ErrorResponse, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});
