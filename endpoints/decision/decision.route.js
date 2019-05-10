import { Router } from "express";
import validate from "express-validation";

import decisionController from "./decision.controller";
import {
  resourceScheme,
  validationScheme,
  queryHistoryScheme,
  queryHistoryByVersionScheme
} from "./decision.param.validation";

const router = Router();
router.route("/sign").post(validate(resourceScheme), decisionController.sign);

router
  .route("/publish")
  .post(validate(resourceScheme), decisionController.publish);

router.route("/getAll").post(decisionController.getAll);
router.route("/queryById").post(decisionController.queryById);

router
  .route("/queryHistory")
  .post(validate(queryHistoryScheme), decisionController.queryHistory);

router
  .route("/queryHistoryByVersion")
  .post(
    validate(queryHistoryByVersionScheme),
    decisionController.queryHistoryByVersion
  );

router
  .route("/validate")
  .post(validate(validationScheme), decisionController.validate);

export default router;
