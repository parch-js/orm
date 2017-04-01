"use strict";

import Sequelize = require("sequelize");
import * as errors from "restify-errors";
import * as inflect from "inflect";

export interface AnyAttributes { [key: string]: any }
export interface ModelInstance extends Sequelize.Instance<AnyAttributes> {}
export interface ModelObject extends Sequelize.Model<ModelInstance, any> {}
export interface ModelsObject { [key: string]: ModelObject; }
export interface WhereOptions extends Sequelize.WhereOptions {}

export default class ORM {
  private _models: Map<string, ModelObject>

  constructor(models: ModelsObject) {
    this._models = new Map();

    Object.keys(models).forEach(model => {
      const modelName = inflect.singularize(model).toLowerCase();

      this._models.set(modelName, models[model]);
    });
  }

  async createRecord(modelName: string, payload: AnyAttributes): Promise<ModelInstance> {
    if (!payload) {
      throw new errors.BadRequestError("Missing or invalid body")
    }

    const model = this._models.get(modelName);
    const record = model.build(payload);
    const validation = await record.validate();

    if (validation && validation.errors && validation.errors.length) {
      const validationErrors = validation.errors;
      const validationError = validationErrors[0];

      throw new errors.UnprocessableEntityError(validationError.message);
    } else if (validation) {
      throw new errors.UnprocessableEntityError(validation.message);
    }

    return record.save();
  }

  async destroyRecord(modelName: string, id: number | string): Promise<void> {
    let record;

    try {
      record = await this.findOne(modelName, id);
    } catch (err) { throw err; }

    return record.destroy();
  }

  findAll(modelName: string, where: WhereOptions, options): Promise<ModelInstance[]> {
    const dataQuery = { where };
    const model = this._models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);

    return model.findAll(modelQuery);
  }

  async findOne(modelName: string, id: number | string, options?: Object): Promise<ModelInstance> {
    const dataQuery = { id };
    const model = this._models.get(modelName);
    let record;

    try {
      record = await this.queryRecord(modelName, dataQuery, options);
    } catch (err) {
      throw err;
    }

    return record;
  }

  async queryRecord(modelName: string, where: WhereOptions, options?: Object): Promise<ModelInstance> {
    const dataQuery = { where };
    const model = this._models.get(modelName);
    const modelQuery = Object.assign(dataQuery, options);
    const record = await model.findOne(modelQuery);

    if (!record) {
      throw new errors.NotFoundError(`${modelName} does not exist`);
    }

    return record;
  }

  async updateRecord(modelName: string, id: number | string, payload: AnyAttributes): Promise<ModelInstance> {
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
        const validationErrors = err.errors;
        const validationError = validationErrors[0];

        throw new errors.UnprocessableEntityError(validationError.message);
      } else if (err) {
        throw new errors.UnprocessableEntityError(err.message);
      }
    }
  }
}
