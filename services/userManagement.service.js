import requestPromise from "request-promise";
import CryptoJS from "crypto-js";

import User from "../models/auth.model";

const RegisterUser = oit =>
  requestPromise
    .post("http://authentication/certificate/create", {
      method: "POST",
      body: {
        enrollmentID: oit.identifier,
        role: oit.roles.toString(),
        id: oit.fullIdentifier,
        seed: oit.secret
      },
      json: true
    })
    .then(async ({ encryptedCert, encryptedKey, encryptionKey }) => {
      let bytes = CryptoJS.AES.decrypt(
        encryptedCert,
        JSON.stringify(encryptionKey)
      );
      const certificatePEM = bytes.toString(CryptoJS.enc.Utf8);

      // Decrypt private key
      bytes = CryptoJS.AES.decrypt(encryptedKey, JSON.stringify(encryptionKey));
      const privateKeyPEM = bytes.toString(CryptoJS.enc.Utf8);

      const newUser = new User({
        username: oit.identifier,
        encryptedCert,
        encryptedKey
      });

      await newUser.save();

      return { username: oit.identifier, certificatePEM, privateKeyPEM };
    })
    .catch(e => new Error(e.error.errors[0].title));

const GetUser = async identifier => User.getByName(identifier);

const GetEncryptionKey = oit =>
  requestPromise
    .post("http://authentication/certificate/retrieveKey", {
      method: "POST",
      body: { identifier: oit, seed: oit.secret },
      json: true
    })
    .then(retrievedKey => JSON.parse(retrievedKey.encryptionKey))
    .catch(e => new Error(e.error.errors[0].title));

export default { RegisterUser, GetUser, GetEncryptionKey };
