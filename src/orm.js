"use strict";

import errors from "restify-errors";
import inflect from "inflect";

/**
 * SQL Database dsl wrapping Sequelize
 *
 * @class ORM
 * @constructor
 * @param {Object} models hash of sequelize defined models
 */
export default class ORM {
  constructor(models) {
    this._models = new Map();

    Object.keys(models).forEach(model => {
      const modelName = inflect.singularize(model).toLowerCase();

      this._models.set(modelName, models[model]);
    });
  }

  /**
   * create a new model instance
   *
   * @method createRecord
   * @param {String} modelName lowercase singular model name
   * @param {Object} payload new instance data
   * @return {Promise}<ModelInstance, RestError>
   * @example
   *
   * ```javascript
   * return orm.createRecord("user", { firstName: "John" });
   * ```
   */
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

  /**
   * Destroy a record instance
   *
   * @method destroyRecord
   * @param {String} modelName lowercase singular model name
   * @param {Number|String} id id of the record to destroy
   * @return {Promise<void>}
   * @example
   *
   * ```javascript
   * return orm.destroyRecord("user", 1);
   * ```
   */
  destroyRecord(modelName, id) {
    return this.findOne(modelName, id)
      .then(record => record.destroy());
  }

  /**
   * findAll
   *
   * @method findAll
   * @param {String} modelName lowercase singular model name
   * @param {Object} where <a href="http://docs.sequelizejs.com/en/v3/docs/querying/#where" target="_blank">Sequelize Where clause</a>
   * @param {Object} options <a href="http://docs.sequelizejs.com/en/v3/api/model/#findoneoptions-promiseinstance" target="_blank">
   *   sequelize finder options
   * </a>
   * @return {Promise}<ModelInstance, RestError>
   * @example
   *
   * ```javascript
   * return orm.findAll("user");
   *
   * // you can also query
   *
   * return orm.findAll("user", { firstName: { $like: "john" }});
   * ```
   */
  findAll(modelName, where, options) {
    const dataQuery = { where };
    const model = this._models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);

    return model.findAll(modelQuery);
  }

  /**
   * findOne
   *
   * @method findOne
   * @param {String} modelName lowercase singular model name
   * @param {Number|String} id id of the record to destroy
   * @param {Object} options <a href="http://docs.sequelizejs.com/en/v3/api/model/#findoneoptions-promiseinstance" target="_blank">
   *   sequelize finder options
   * </a>
   * @return {Promise}<ModelInstance, RestError>
   * @example
   *
   * ```javascript
   * return orm.findOne("user", 1);
   * ```
   */
  findOne(modelName, id, options) {
    const dataQuery = { id };

    return this.queryRecord(modelName, dataQuery, options);
  }

  /**
   * queryRecord
   *
   * @method queryRecord
   * @param {String} modelName lowercase singular model name
   * @param {Object} where <a href="http://docs.sequelizejs.com/en/v3/docs/querying/#where" target="_blank">Sequelize Where clause</a>
   * @param {Object} options <a href="http://docs.sequelizejs.com/en/v3/api/model/#findoneoptions-promiseinstance" target="_blank">
   *   sequelize finder options
   * </a>
   * @return {Promise}<ModelInstance, RestError>
   * @example
   *
   * ```javascript
   * return orm.queryRecord("user", { firstName: "John" });
   * ```
   */
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

  /**
   * updateRecord
   *
   * @method updateRecord
   * @param {String} modelName lowercase singular model name
   * @param {Number|String} id id of the record to destroy
   * @param {Object} payload new instance data
   * @return {Promise}<ModelInstance, RestError>
   * @example
   *
   * ```javascript
   * return orm.updateRecord("user", 1, { firsName: "Joe" });
   * ```
   */
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
