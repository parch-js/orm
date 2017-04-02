"use strict";

import Sequelize from "sequelize";

const connection = {
  dialect: "sqlite",
  database: "test",
  username: "test",
  password: "test",
  logging: false
};
const sequelize = new Sequelize(
  connection.database,
  connection.username,
  connection.password,
  connection
);

const UserModel = sequelize.define("user", {
  firstName: {
    type: Sequelize.STRING,
    validate: {
      is: {
        args: ["^[a-z]+$", "i"],
        msg: "firstName must be a valid string"
      }
    }
  },
  lastName: {
    type: Sequelize.STRING
  }
});

const ProjectModel = sequelize.define("project", {
  name: {
    type: Sequelize.STRING
  }
});

const GroupModel = sequelize.define("group", {
  name: {
    type: Sequelize.STRING
  }
});

UserModel.hasOne(UserModel, { as: "Parent" });
UserModel.belongsToMany(GroupModel, { through: "UserGroups" });
UserModel.hasMany(ProjectModel);

export const models = {
  Group: GroupModel,
  Project: ProjectModel,
  User: UserModel
};

export default {
  GroupModel,
  ProjectModel,
  Sequelize,
  UserModel,
  models,
  sequelize
};
