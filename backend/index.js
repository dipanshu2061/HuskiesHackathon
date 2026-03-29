import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from "dotenv"
import mongoose from 'mongoose';
import {PlaidEnvironments, PlaidApi, Configuration} from "plaid"

import plaidRoutes from "./src/routes/plaid.js"
import authRoutes from "./src/routes/auth.js"
import aiRouter from "./src/routes/ai.js";

import middlewares from './src/routes/middleware.js';

dotenv.config()

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      }
    }
  })
);

(async () => {
   await mongoose.connect(process.env.MONGOURI)
    console.log("db connected")


    const app = express()
    app.use(cors("*"));
    app.use(express.json())
    app.use(morgan('tiny'));


    app.use("/api/plaid", plaidRoutes)
    app.use("/api/auth", authRoutes)
    app.use("/api/ai", aiRouter);

    app.use(middlewares.notFound);
    app.use(middlewares.errorHandler);

    const port = 5000;
    app.listen(port, () => console.log(`Server has started on port: ${port}`))

})()
