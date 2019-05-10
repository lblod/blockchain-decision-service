import signingHelper from "../utils/helpers/signing.helper";
import logger from "../config/Log";

const SignTransaction = async (args, user, func) => {
  logger.info("Preparing request for resource");
  const proposal = signingHelper.prepareRequest(
    func,
    [JSON.stringify(args)],
    true,
    user.certificatePEM
  );
  return signingHelper.invokeOffline(
    proposal,
    user.privateKeyPEM,
    user.certificatePEM
  );
};

export default { SignTransaction };
