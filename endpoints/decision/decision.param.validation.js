import Joi from "joi";

export const resourceScheme = {
  body: {
    id: Joi.string().required(),
    content: Joi.string().required(),
    oit: {
      identifier: Joi.string().required(),
      roles: Joi.array().required(),
      secret: Joi.string().required(),
      fullIdentifier: Joi.string().required()
    },
    resourceId: Joi.string().required(),
    subject: Joi.string().required(),
    timestamp: Joi.string().required()
  }
};

export const validationScheme = {
  body: {
    content: { value: Joi.string().required() },
    resourceUri: {
      value: Joi.string().required()
    }
  }
};

export const queryHistoryScheme = {
  body: {
    id: Joi.string().required()
  }
};

export const queryHistoryByVersionScheme = {
  body: {
    id: Joi.string().required(),
    version: Joi.string().required()
  }
};
