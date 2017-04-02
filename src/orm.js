"use strict";

import errors from "restify-errors";
import inflect from "inflect";

export default class ORM {
  constructor(models) {
    this._models = new Map();

    Object.keys(models).forEach(model => {
      const modelName = inflect.singularize(model).toLowerCase();

      this._models.set(modelName, models[model]);
    });
  }

  createRecord(modelName, payload) {
    if (!payload) {
      return Promise.reject(
        new errors.BadRequestError("Missing or invalid body")
      );
    }

    const model = this._models.get(modelName);
    const record = model.build(payload);

    return record.validate().then(validation => {
      if (validation && validation.errors && validation.errors.length) {
        const validationErrors = validation.errors;
        const validationError = validationErrors[0];

        throw new errors.UnprocessableEntityError(validationError.message);
      } else if (validation) {
        throw new errors.UnprocessableEntityError(validation.message);
      }

      return record.save();
    });
  }

  destroyRecord(modelName, id) {
    return this.findOne(modelName, id)
      .then(record => record.destroy());
  }

  findAll(modelName, where, options) {
    const dataQuery = { where };
    const model = this._models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);

    return model.findAll(modelQuery);
  }

  findOne(modelName, id, options) {
    const dataQuery = { id };

    return this.queryRecord(modelName, dataQuery, options);
  }

  queryRecord(modelName, where, options) {
    const dataQuery = { where };
    const model = this._models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);

    return model.findOne(modelQuery).then(record => {
      if (!record) {
        const NotFound = errors.NotFoundError;
        const message = "user does not exist";

        throw new NotFound(message);
      }

      return record;
    });
  }

  updateRecord(modelName, id, payload) {
    if (!payload) {
      return Promise.reject(
        new errors.BadRequestError("Missing or invalid body")
      );
    }

    return this.findOne(modelName, id)
      .then(record => record.update(payload))
      .catch(err => {
        /**
         * HACK: if this is a sequelize validation error, we transform it, otherwise
         * we can't be totally sure so just throw it up the stack
         */
        if (err.name === "SequelizeValidationError") {
          const { errors: [validationError] } = err;
          const error = errors.UnprocessableEntityError;
          const message = validationError.message;

          throw new error(message);
        } else {
          throw err;
        }
      });
  }
}
