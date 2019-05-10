import signingService from "./signing.service";
import queryService from "./query.service";
import decisionHelper from "../utils/helpers/decision.helper";
import logger from "../config/Log";

const Publish = async resource => {
  try {
    // GET USERID OUT OF RESOURCE
    const { content, resourceId, oit, timestamp, subject, version } = resource;
    const mockLimitedSigners = 2;

    const user = await decisionHelper.getUser(oit);

    // SIGN TRANSACTION
    const args = {
      id: resourceId,
      hash: content,
      subject,
      timestamp,
      version,
      limitedSigners: mockLimitedSigners
    };

    const result = await signingService.SignTransaction(
      args,
      user,
      "publishResource"
    );
    logger.info("Resource was succesfully published to the blockchain!");
    return result;
  } catch (e) {
    logger.info(`Something went wrong in decision.service.js: ${e}`);
    throw e;
  }
};

const Sign = async (resource, burn) => {
  try {
    // GET USERID OUT OF RESOURCE
    const { content, resourceId, oit, timestamp, subject, version } = resource;
    const mockLimitedSigners = 2;

    const user = await decisionHelper.getUser(oit);

    // SIGN TRANSACTION
    const args = {
      id: resourceId,
      hash: content,
      timestamp,
      limitedSigners: mockLimitedSigners,
      subject,
      version,
      burn
    };

    const result = await signingService.SignTransaction(
      args,
      user,
      "signResource"
    );
    logger.info("Resource was succesfully published to the blockchain!");
    return result;
  } catch (e) {
    logger.info(`Something went wrong in decision.service.js: ${e}`);
    throw e;
  }
};

const GetResourceHistory = id => queryService.GetResourceHistory(id);
const GetResourceHistoryByVersion = (id, version) =>
  queryService.GetResourceHistoryByVersion(id, version);

const Validate = (id, hash) => queryService.Validate(id, hash);

const GetAll = () => queryService.GetAll();

const GetResourceById = id => queryService.GetResourceById(id);

export default {
  Publish,
  Sign,
  Validate,
  GetAll,
  GetResourceById,
  GetResourceHistory,
  GetResourceHistoryByVersion
};
