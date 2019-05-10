import { app, errorHandler } from "mu";
import mongoose from "mongoose";
import util from "util";

import routes from "./app.routes";
import logger from "./config/Log";
import network from "./services/network.service";
import config from "./config/config";

const mongoUri = `mongodb://mongodb:27017/${config.dbName}`;

const init = async () => {
  logger.info("=========== STARTING UP DECISION SERVER ===========");
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  app.use(routes);
  app.use(errorHandler);

  try {
    await network.initFabric();
  } catch (e) {
    logger.info(`Please restart the resource server. ${e}`);
    process.exit(1);
  }

  // connect to mongo db
  mongoose
    .connect(
      mongoUri,
      {
        useCreateIndex: true,
        useNewUrlParser: true,
        poolSize: 2,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 5000,
        auth: {
          user: config.mongoUser,
          password: config.mongoPass
        }
      }
    )
    .then(
      () => {
        // start server
        app.listen(80, () =>
          logger.info(
            `Started decision server on port 80 in ${app.get("env")} mode`
          )
        );

        // print mongoose logs in dev env
        if (app.get("env") === "development") {
          mongoose.set("debug", (collectionName, method, query, doc) => {
            logger.info(
              `${collectionName}.${method}`,
              util.inspect(query, false, 20),
              doc
            );
          });
        }
      },
      e => new Error(`unable to connect to database: ${config.mongoUri}`, e)
    );
};

init();
