import httpStatus from "http-status";
import sha256 from "crypto-js/sha256";

import logger from "../../config/Log";
import decisionService from "../../services/decision.service";

const publish = async (req, res, next) => {
  try {
    logger.info("Publishing resources..");
    const resource = req.body;
    const result = await decisionService.Publish(resource);
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    if (e.error && e.error.errors) {
      const unifiedErrorMessage = e.error.errors
        .map(error => error.title)
        .join(" and ");
      next({ message: unifiedErrorMessage });
    }

    next({ message: e.message });
  }
};

const sign = async (req, res, next) => {
  try {
    const resource = req.body;
    const { burn } = req.query;
    logger.info(`Signing resources to ${burn ? "burn" : "approve"}`);

    const result = await decisionService.Sign(resource, burn);
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    next(e);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await decisionService.GetAll();
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    next(e);
  }
};

const validate = async (req, res, next) => {
  try {
    const resource = req.body;
    const id = resource.resourceUri.value;
    const hash = sha256(resource.content.value).toString();

    const { result, blockchainHash } = await decisionService.Validate(id, hash);
    res.status(httpStatus.OK).json({
      id,
      hash,
      result,
      blockchainHash
    });
  } catch (e) {
    next(e);
  }
};

const queryById = async (req, res, next) => {
  try {
    const { id } = req.body;
    const result = await decisionService.GetResourceById(id);
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    next(e);
  }
};

const queryHistory = async (req, res, next) => {
  try {
    const { id } = req.body;
    const result = await decisionService.GetResourceHistory(id);
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    next(e);
  }
};

const queryHistoryByVersion = async (req, res, next) => {
  try {
    const { id, version } = req.body;
    const result = await decisionService.GetResourceHistoryByVersion(
      id,
      version
    );
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    next(e);
  }
};

export default {
  publish,
  getAll,
  sign,
  validate,
  queryById,
  queryHistory,
  queryHistoryByVersion
};
