import httpStatus from "http-status";
import { isBuffer } from "lodash";

import logger from "../config/Log";
import network from "./network.service";

let channel = null;

const query = async (fcn, args) => {
  try {
    channel = await network.getChannel();

    const channelPeers = channel.getChannelPeers();
    const peers = channelPeers.map(channelpeer => {
      if (channelpeer._roles.endorsingPeer) {
        return channelpeer.getName();
      }
    });

    // send query
    const request = {
      targets: peers, // queryByChaincode allows for multiple targets
      chaincodeId: network.getChaincodeName(),
      fcn,
      args
    };
    const responsePayloads = await channel.queryByChaincode(request);

    if (responsePayloads.length === 0 || responsePayloads === undefined) {
      throw new Error(
        `Error from query: No result `,
        httpStatus.BAD_REQUEST,
        true
      );
    }

    for (let i = 0; i < responsePayloads.length; i += 1) {
      logger.info(
        `result received from peer ${i}: ${responsePayloads[i].toString(
          "utf8"
        )}`
      );
    }

    // TODO multiple peers, multiple responses

    if (isBuffer(responsePayloads[0])) {
      return JSON.parse(responsePayloads[0].toString("utf8"));
    }

    return {
      result: responsePayloads[0].toString("utf8")
    };
  } catch (e) {
    logger.info(e);
    return e;
  }
};

const GetAll = async () => query("queryAll", []);

const Validate = async (id, hash) => {
  const result = await query("validateResource", [
    JSON.stringify({ id, hash })
  ]);
  return {
    result: result.result,
    blockchainHash: result.hash
  };
};

const GetResourceById = async id =>
  query("queryById", [JSON.stringify({ id })]);

const GetResourceHistory = async id =>
  query("queryHistory", [JSON.stringify({ id })]);

const GetResourceHistoryByVersion = async (id, version) =>
  query("queryHistoryByVersion", [JSON.stringify({ id, version })]);

export default {
  GetAll,
  Validate,
  GetResourceById,
  GetResourceHistory,
  GetResourceHistoryByVersion
};
