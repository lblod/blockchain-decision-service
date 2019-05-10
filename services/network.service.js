import FabricClient from "fabric-client";
import path from "path";

import config from "../config/config";
import logger from "../config/Log";

const fabricClient = new FabricClient();
let channel = null;
const eventHub = null;
let adminUser = null;
let fabricCaClient = null;
let ORG_MSP = null;
let channelName = null;
let chaincodeName = null;

const register = async (user, secret = null) => {
  if (!secret) {
    logger.info("Creating secret");
    // eslint-disable-next-line no-param-reassign
    secret = await fabricCaClient
      .register(
        {
          role: user.role,
          enrollmentID: user.username,
          affiliation: user.affiliation,
          attrs: [] // TODO add municipality
        },
        adminUser
      )
      .catch(err => Promise.reject(err));
  }

  logger.info("Enrolling user on the fabric network");
  // Enroll the user
  const enrollment = await fabricCaClient
    .enroll({
      enrollmentID: user.username,
      enrollmentSecret: secret
    })
    .catch(err => Promise.reject(new Error(`Failed to enroll: ${err}`)));

  // Create the user
  const finalUser = await fabricClient.createUser({
    username: user.username,
    mspid: ORG_MSP,
    cryptoContent: {
      privateKeyPEM: enrollment.key.toBytes(),
      signedCertPEM: enrollment.certificate
    },
    skipPersistence: false
  });

  logger.info("User was succesfully enrolled on the fabric network!");

  if (user.username === "admin") {
    return finalUser;
  }

  return Object.assign({}, finalUser, {
    signedCertPEM: enrollment.certificate,
    privateKeyPEM: enrollment.key.toBytes()
  });
};

const getClientForOrg = async (orgName, username) => {
  const configName = "-connection-profile-path";
  const client = FabricClient.loadFromConfig(
    FabricClient.getConfigSetting(`network${configName}`)
  );

  client.loadFromConfig(FabricClient.getConfigSetting(`client${configName}`));

  await client.initCredentialStores();

  if (username === "admin") {
    const user = fabricClient.getUserContext("admin", true);
    await client.setUserContext(user, true);
  }

  return client;
};

const initFabric = async () => {
  const file = "network-config-server.yaml";

  FabricClient.setConfigSetting(
    "network-connection-profile-path",
    path.join("/clients/", file)
  );

  FabricClient.setConfigSetting(
    `client-connection-profile-path`,
    path.join("/clients/", `client.yaml`)
  );

  // Define storepath
  const storePath = path.join(__dirname, "../.hfc-key-store");

  // Set new crypto suite
  const cryptoSuite = FabricClient.newCryptoSuite();
  fabricClient.setCryptoSuite(cryptoSuite);

  // Set default key-value store to storePath
  const stateStore = await FabricClient.newDefaultKeyValueStore({
    path: storePath
  });
  fabricClient.setStateStore(stateStore);

  // Set crypto keystore to storePath
  const cryptoStore = FabricClient.newCryptoKeyStore({ path: storePath });
  cryptoSuite.setCryptoKeyStore(cryptoStore);

  const client = await getClientForOrg("client");
  client.setCryptoSuite(cryptoSuite);
  client.setStateStore(stateStore);
  fabricCaClient = client.getCertificateAuthority();
  ORG_MSP = client.getMspid();

  // Check if admin is enrolled
  const userFromStore = await fabricClient.getUserContext("admin", true);

  if (userFromStore && userFromStore.isEnrolled()) {
    adminUser = userFromStore;
  } else {
    adminUser = await register(
      {
        username: "admin",
        role: "admin",
        affiliation: `org1.department1`
      },
      config.ADMIN_PW
    );
  }

  client.setUserContext(adminUser, true);

  // TODO multiple channels
  [channelName] = Object.keys(client._network_config._network_config.channels);

  channel = client.getChannel(channelName);
  if (!channel) {
    throw new Error(
      "Channel %s was not defined in the connection profile",
      channelName
    );
  }

  // TODO multiple chaincodes
  const chaincodeInfo = await channel.queryInstantiatedChaincodes();
  chaincodeName = chaincodeInfo.chaincodes[0].name;

  logger.info("Config has been set!");
};

const getFabricClient = () => fabricClient;
const getChannel = () => channel;
const getEventHub = () => eventHub;
const getChannelName = () => channelName;
const getOrgMsp = () => ORG_MSP;
const getChaincodeName = () => chaincodeName;

export default {
  getFabricClient,
  getChannel,
  getEventHub,
  initFabric,
  getClientForOrg,
  getChannelName,
  getOrgMsp,
  getChaincodeName
};
