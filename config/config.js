import Joi from "joi";

// require and configure dotenv, will load vars in .env in PROCESS.ENV
import dotenv from "dotenv";

dotenv.config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGO_PORT: Joi.number().default(27017),
  NODE_ENV: Joi.string()
    .allow(["development", "production", "test", "provision"])
    .default("development"),
  MONGOOSE_DEBUG: Joi.boolean().when("NODE_ENV", {
    is: Joi.string().equal("development"),
    then: Joi.boolean().default(true),
    otherwise: Joi.boolean().default(false)
  }),
  ADMIN_PW: Joi.string()
    .required()
    .description("Admin password required"),
  APP_MONGO_USER: Joi.string()
    .required()
    .description("App Mongo User"),
  APP_MONGO_PASS: Joi.string()
    .required()
    .description("App Mongo User Password"),
  MONGO_INITDB_DATABASE: Joi.string()
    .required()
    .description("DB Name")
})
  .unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);

if (error) {
  throw new Error(
    `Check your '.env' file (located at the root of this project),
    validation error: ${error.message}`
  );
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  ADMIN_PW: envVars.ADMIN_PW,
  mongoUser: envVars.APP_MONGO_USER,
  mongoPass: envVars.APP_MONGO_PASS,
  dbName: envVars.MONGO_INITDB_DATABASE
};

export default config;
