import CryptoJS from "crypto-js";

import userManagementervice from "../../services/userManagement.service";

const decryptCerts = (foundUser, encryptionKey) => {
  let bytes = CryptoJS.AES.decrypt(
    foundUser.encryptedCert,
    JSON.stringify(encryptionKey)
  );
  const certificatePEM = bytes.toString(CryptoJS.enc.Utf8);

  // Decrypt private key
  bytes = CryptoJS.AES.decrypt(
    foundUser.encryptedKey,
    JSON.stringify(encryptionKey)
  );
  const privateKeyPEM = bytes.toString(CryptoJS.enc.Utf8);

  return { certificatePEM, privateKeyPEM };
};

const getCorrectTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  return `${year}-${month < 10 ? `0${month}` : `${month}-${day}`}`;
};

const getNewResourceId = uri => uri.split("/")[uri.split("/").length - 1];

const getUser = async oit => {
  // GET USER
  const foundUser = await userManagementervice.GetUser(oit.identifier);

  // REGISTER USER IF NULL
  if (!foundUser) {
    return userManagementervice.RegisterUser(oit);
  }
  const encryptionKey = await userManagementervice.GetEncryptionKey(oit);
  const { certificatePEM, privateKeyPEM } = decryptCerts(
    foundUser,
    encryptionKey
  );
  return {
    username: oit.identifier,
    certificatePEM,
    privateKeyPEM
  };
};

export default {
  getUser,
  decryptCerts,
  getCorrectTimestamp,
  getNewResourceId
};
