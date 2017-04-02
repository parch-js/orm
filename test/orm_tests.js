"use strict";

import { expect } from "chai";

import ORM from "../src/orm";
import fixtures from "./fixtures";

describe("ORM", function () {
  let orm, user;

  beforeEach(function () {
    orm = new ORM(fixtures.models);

    return fixtures.sequelize.sync({ force: true }).then(() => {
      return fixtures.UserModel.create({
        firstName: "John",
        lastName: "Smith"
      }).then(john => user = john);
    });
  });

  describe("#findAll", function () {
    it("returns all records", function () {
      return orm.findAll("user").then(users => {
        expect(users[0].firstName).to.eql(user.firstName);
      });
    });

    it("allows for querying", function () {
      return fixtures.UserModel.create({
        firstName: "Jane"
      }).then(jane => {
        return orm.findAll("user", { firstName: { $like: "jane" }}).then(users => {
          expect(users).to.have.length(1);
          expect(users[0].firstName).to.eql("Jane");
        })
      });
    });

    it("allows for query options", function () {
      return orm.findAll("user", null, { attributes: ["lastName"] }).then(users => {
        expect(users[0].lastName).to.eql("Smith");
        expect(users[0].dataValues).to.not.have.key("firstName");
      });
    });
  });

  describe("#findOne", function () {
    it("returns a single record by id", function () {
      return orm.findOne("user", user.id).then(john => {
        expect(john.id).to.eql(user.id);
      });
    });

    it("throws a NotFound error if the record doesn't exist", function (done) {
      orm.findOne("user", 12345987).catch(err => {
        expect(err.body.message).to.eql("user does not exist");
        done();
      });
    });

    it("allows for query options", function () {
      return orm.findOne("user", user.id, { attributes: ["lastName"] }).then(john => {
        expect(john.lastName).to.eql("Smith");
        expect(john.dataValues).to.not.have.key("firstName");
      });
    });
  });

  describe("#queryRecord", function () {
    it("returns a single record by query", function () {
      return orm.queryRecord("user", { firstname: { $like: "john" }}).then(john => {
        expect(john.id).to.eql(user.id);
      });
    });

    it("throws a NotFound error if the record doesn't exist", function (done) {
      orm.queryRecord("user", { firstName: "foo" }).catch(err => {
        expect(err.body.message).to.eql("user does not exist");
        done();
      });
    });

    it("allows for query options", function () {
      return orm.queryRecord(
        "user",
        { firstName: "John" },
        { attributes: ["lastName"] }
      ).then(john => {
        expect(john.lastName).to.eql("Smith");
        expect(john.dataValues).to.not.have.key("firstName");
      });
    });
  });

  describe("#createRecord", function () {
    it("creates a record", function () {
      return orm.createRecord("user", { firstName: "Jane" }).then(jane => {
        expect(jane.firstName).to.eql("Jane");
      });
    });

    it("validates the request body", function (done) {
      orm.createRecord("user").catch(err => {
        expect(err.body.message).to.eql("Missing or invalid body");
        done();
      });
    });

    it("validates the model instance", function (done) {
      orm.createRecord("user", { firstName: "+ " }).catch(err => {
        expect(err.body.message).to.eql("firstName must be a valid string");
        done();
      });
    });
  });

  describe("#updateRecord", function () {
    it("updates an existing record", function () {
      return orm.updateRecord("user", user.id, { firstName: "joe" }).then(joe => {
        expect(joe.firstName).to.eql("joe");
      });
    });

    it("throws a NotFound error if the record doesn't exist", function (done) {
      orm.updateRecord("user", 123098, { firstName: "joe" }).catch(err => {
        expect(err.body.message).to.eql("user does not exist");
        done();
      });
    });

    it("validates the request body", function (done) {
      orm.updateRecord("user", 123098).catch(err => {
        expect(err.body.message).to.eql("Missing or invalid body");
        done();
      });
    });

    it("validates the model instance", function (done) {
      orm.updateRecord("user", user.id, { firstName: "+ " }).catch(err => {
        expect(err.body.message).to.eql("firstName must be a valid string");
        done();
      });
    });
  });

  describe("#destroyRecord", function () {
    it("destroys a record", function (done) {
      orm.destroyRecord("user", user.id).then(() => {
        return orm.findOne("user", user.id);
      }).catch(err => {
        expect(err.body.message).to.eql("user does not exist");
        done();
      });
    });

    it("throws a NotFound error if the record doesn't exist", function (done) {
      orm.destroyRecord("user", 123083).catch(err => {
        expect(err.body.message).to.eql("user does not exist");
        done();
      });
    });
  });
})
