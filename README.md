# ORM

[![Build Status](https://travis-ci.org/parch-js/orm.svg?branch=develop)](https://travis-ci.org/parch-js/orm)
[![Coverage Status](https://coveralls.io/repos/github/parch-js/orm/badge.svg?branch=develop)](https://coveralls.io/github/parch-js/orm?branch=develop)
[![bitHound Overall Score](https://www.bithound.io/github/parch-js/orm/badges/score.svg)](https://www.bithound.io/github/parch-js/orm)

> Simple DSL for accessing data stored in a SQL store.

## Installation

`npm install --save @parch-js/orm`

## Usage

Models passed to the constructor must come from a [sequelize](http://docs.sequelizejs.com/en/v3/) definition

```javascript
import ORM from "@parch-js/orm";

const orm = new ORM({
  User: SequelizeDefinedUserModel
});

return orm.findAll("user",
  { firstName: "foo" },
  { attributes: ["firstName"] }
).then(users => {});

return orm.findOne("user", 1,
  { attributes: ["firstName"] }
)then(user => {});

return orm.queryRecord("user",
  { firstName: "foo" },
  { attributes: ["firstName"] }
).then(user => {});

return orm.createRecord("user", { firstName: "bar"}).then(user => {});
return orm.updateRecord("user", 1, { firstName: "baz" }).then(user => {});
return orm.destroyRecord("user", 1).then(() => {});
```

[Read the docs](https://parch-js.github.io/orm/docs) for more in depth usage.