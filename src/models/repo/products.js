const { assoc, omit, compose } = require('ramda')
// const { stringify } = require('../../utilities')
const { if_exists, if_already_exists } = require('../../utilities/errors_code')
const Product = require('../product')

// const stringify_attachments = evolve({ 'attachments': stringify })
module.exports = {
  list: (params) => {
    let query = Product.query()

    return query
      .page(params.page - 1, params.limit)
      .orderBy(params.orderBy, params.order)
      .where(omit(['limit', 'offset', 'orderBy', 'page', 'order'], params))
  },
  get: (id, params = {}) => {
    const query = Product.query()

    query
      .where({ id })
      .where(params)
      .first()

    return query.then(if_exists)
  },
  create: (body) => {
    return Product.query().where({ code: body.code }).first()
      .then(if_already_exists)
      .then(() => Product.query().insert(compose(assoc('created_at', new Date()))(body)))
      .then((product) => Product.query().where({ id: product.id }).first())
  },
  update: (id, body) => {
    return Product.query().where({ code: body.code }).whereNot({ id }).first()
      .then(if_already_exists)
      .then(() => Product.query().where({ id }).patch(compose(assoc('edited_at', new Date()))(body)))
      .then(() => Product.query().where({ id }).first())
  },
}
