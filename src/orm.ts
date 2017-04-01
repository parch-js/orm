"use strict";

import Sequelize = require("sequelize");
import * as errors from "restify-errors";
import * as inflect from "inflect";

export interface AnyAttributes {}

export default class ORM {
  models: Map<string, Sequelize.Model<Sequelize.Instance<AnyAttributes>, any>>;

  constructor(models) {
    this.models = new Map();

    Object.keys(models).forEach(model => {
      const modelName = inflect.singularize(model).toLowerCase();

      this.models.set(modelName, models[model]);
    });
  }

  async createRecord(modelName: string, payload: Object): Promise<any> {
    if (!payload) {
      throw new errors.BadRequestError("Missing or invalid body")
    }

    const model = this.models.get(modelName);
    const record = model.build(payload);
    const validation = await record.validate();

    if (validation && validation.errors && validation.errors.length) {
      const { errors: [validationError] } = validation;

      throw new errors.UnprocessableEntityError(validationError.message);
    } else if (validation) {
      throw new errors.UnprocessableEntityError(validation.message);
    }

    return record.save();
  }

  async destroyRecord(modelName: string, id: number | string): Promise<any> {
    let record;

    try {
      record = await this.findOne(modelName, id);
    } catch (err) { throw err; }

    return record.destroy();
  }

  findAll(modelName, where, options): Promise<any> {
    const dataQuery = { where };
    const model = this.models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);

    return model.findAll(modelQuery);
  }

  async findOne(modelName: string, id: number | string, options?: Object) {
    const dataQuery = { id };
    const model = this.models.get(modelName);
    let record;

    try {
      record = await this.queryRecord(modelName, dataQuery, options);
    } catch (err) {
      throw err;
    }

    return record;
  }

  async queryRecord(modelName: string, where: Object, options?: Object) {
    const dataQuery = { where };
    const model = this.models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);
    const record = await model.findOne(modelQuery);

    if (!record) {
      throw new errors.NotFoundError(`${modelName} does not exist`);
    }

    return record;
  }

  async updateRecord(modelName: string, id: number | string, payload: Object) {
    if (!payload) {
      throw new errors.BadRequestError("Missing or invalid body")
    }

    let record;

    try {
      record = await this.findOne(modelName, id);
    } catch (err) { throw err; }

    try {
      const updatedRecord = await record.update(payload);

      return updatedRecord;
    } catch (err) {
      if (err && err.errors && err.errors.length) {
        const { errors: [validationError] } = err;

        throw new errors.UnprocessableEntityError(validationError.message);
      } else if (err) {
        throw new errors.UnprocessableEntityError(err.message);
      }
    }
  }
}
