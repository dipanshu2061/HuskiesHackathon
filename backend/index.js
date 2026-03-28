import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from "dotenv"
import {PlaidEnvironments, PlaidApi, Configuration} from "plaid"

import plaidRoutes from "./src/routes/plaid.js"


import middlewares from './src/routes/middleware.js';

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors());
app.use(morgan('tiny'));

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
)

app.use("/api/plaid", plaidRoutes)

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
const port = 5000;
app.listen(port, () => console.log(`Server has started on port: ${port}`))

