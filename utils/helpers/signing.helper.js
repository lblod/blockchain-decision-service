import shajs from "sha.js";
import { isEmpty } from "lodash";
import elliptic from "elliptic";
import { KEYUTIL } from "jsrsasign";

import network from "../../services/network.service";
import logger from "../../config/Log";

let channel = null;
let targets = null;

const _preventMalleability = sig => {
  try {
    const ordersForCurve = {
      secp256r1: {
        halfOrder: elliptic.curves.p256.n.shrn(1),
        order: elliptic.curves.p256.n
      },
      secp384r1: {
        halfOrder: elliptic.curves.p384.n.shrn(1),
        order: elliptic.curves.p384.n
      }
    };
    const { halfOrder } = ordersForCurve.secp256r1;
    if (!halfOrder) {
      throw new Error(
        'Can not find the half order needed to calculate "s" value for immalleable signatures. Unsupported curve name: secp256r1'
      );
    }

    // in order to guarantee 's' falls in the lower range of the order, as explained in the above link,
    // first see if 's' is larger than half of the order, if so, it needs to be specially treated
    if (sig.s.cmp(halfOrder) === 1) {
      // module 'bn.js', file lib/bn.js, method cmp()
      // convert from BigInteger used by jsrsasign Key objects and bn.js used by elliptic Signature objects
      const bigNum = ordersForCurve.secp256r1.order;
      sig.s = bigNum.sub(sig.s); //eslint-disable-line
    }

    return sig;
  } catch (e) {
    throw new Error(`_preventMalleabilit: ${e}`);
  }
};

const signProposal = async (proposal, privateKeyPEM) => {
  try {
    const digest = shajs("sha256")
      .update(proposal)
      .digest("hex");

    const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM);

    const { ec: EC } = elliptic;
    const ecdsaCurve = elliptic.curves.p256;

    const ecdsa = new EC(ecdsaCurve);
    const signKey = ecdsa.keyFromPrivate(prvKeyHex, "hex");
    let sig = ecdsa.sign(Buffer.from(digest, "hex"), signKey);
    sig = _preventMalleability(sig, prvKeyHex.ecparams);

    // now we have the signature, next we should send the signed transaction proposal to the peer
    const signature = Buffer.from(sig.toDER());
    return {
      signature,
      proposal_bytes: proposal
    };
  } catch (e) {
    throw new Error(`signProposal: ${e}`);
  }
};

const prepareRequest = (fcn, args, invocation = true, certPem) => {
  try {
    const channelName = network.getChannelName();
    channel = network.getChannel();

    const request = {
      channelId: channelName,
      chaincodeId: network.getChaincodeName(),
      fcn,
      args
    };

    if (invocation) {
      return channel.generateUnsignedProposal(
        request,
        network.getOrgMsp(),
        certPem
      );
    }
    return request;
  } catch (e) {
    throw new Error(`prepareRequest: ${e}`);
  }
};

// eslint-disable-next-line
const processTxEvent = (txId, { signedEvent = {} }) =>
  new Promise((resolve, reject) => {
    const eventHub = channel.newChannelEventHub(targets[0]);

    if (!isEmpty(signedEvent)) {
      eventHub.connect({
        signedEvent
      });
    } else {
      eventHub.connect();
    }

    eventHub.registerTxEvent(
      txId,
      (tx, statusCode) => {
        eventHub.unregisterTxEvent(txId);
        eventHub.disconnect();

        if (statusCode !== "VALID") {
          return reject(
            new Error(
              `Problem with the tranaction, event status ::${statusCode}`
            )
          );
        }

        logger.info(
          `The transaction has been committed on peer ${
            eventHub._peer._endpoint.addr
          }`
        );

        resolve({
          statusCode,
          tx
        });
      },
      err => {
        eventHub.disconnect();
        return reject(
          new Error(`There was a problem with the eventhub ::${err}`)
        );
      }
    );
  });

// eslint-disable-next-line
const invokeOffline = async ({ txId, proposal }, privateKeyPEM, certPEM) => {
  try {
    const signedProposal = await signProposal(
      proposal.toBuffer(),
      privateKeyPEM
    );
    targets = channel.getPeers().map(peer => peer.getPeer());
    const sendSignedProposalReq = {
      signedProposal,
      targets
    };

    const proposalResponses = await channel.sendSignedProposal(
      sendSignedProposalReq
    );

    // Sign and send commit
    const commitReq = {
      proposalResponses,
      proposal
    };

    for (const response of proposalResponses) {
      if (response.response) {
        if (response.response.status !== 200) {
          throw new Error(response.message);
        }
      } else {
        throw new Error(response.message);
      }
    }

    const commitProposal = await channel.generateUnsignedTransaction(commitReq);

    const signedCommitProposal = await signProposal(
      commitProposal.toBuffer(),
      privateKeyPEM
    );

    const response = await channel.sendSignedTransaction({
      signedProposal: signedCommitProposal,
      request: commitReq
    });

    if (response.status !== "SUCCESS") {
      throw new Error("Something went wrong");
    }

    // let peer = channel.getChannelEventHubsForOrg(network.getOrgMsp()).getPeer();
    const eventHub = channel.newChannelEventHub(targets[0]);
    const unsignedEvent = await eventHub.generateUnsignedRegistration({
      certificate: certPEM,
      mspId: network.getOrgMsp()
    });

    const signedEventProposal = await signProposal(
      unsignedEvent,
      privateKeyPEM
    );
    const signedEvent = {
      signature: signedEventProposal.signature,
      payload: signedEventProposal.proposal_bytes
    };

    return processTxEvent(txId.getTransactionID(), {
      signedEvent
    });
  } catch (e) {
    throw new Error(`invokeOffline: ${e}`);
  }
};

export default {
  prepareRequest,
  invokeOffline
};
