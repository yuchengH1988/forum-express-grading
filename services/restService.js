const db = require('../models')
const { Restaurant, Category, Comment, User } = db
const sequelize = db.sequelize
const pageLimit = 10
const helpers = require('../_helpers')

const restService = {
  getRestaurants: (req, res, callback) => {
    let offset = 0
    let whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery['CategoryId'] = categoryId
    }
    Restaurant.findAndCountAll({
      include: Category,
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    }).then(result => {
      // data for pagination
      let page = Number(req.query.page) || 1
      let pages = Math.ceil(result.count / pageLimit)
      let totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      let prev = page - 1 < 1 ? 1 : page - 1
      let next = page + 1 > pages ? pages : page + 1

      // clean up restaurant data
      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.dataValues.Category.name,
        isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id),
        isLiked: req.user.LikedRestaurants.map(d => d.id).includes(r.id)
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return callback({
          restaurants: data,
          categories: categories,
          categoryId: categoryId,
          page: page,
          totalPage: totalPage,
          prev: prev,
          next: next
        })
      })
    })
  },
  getRestaurant: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }]
    }).then(restaurant => {
      const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      const isLiked = restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      return restaurant.increment('viewCounts', { by: 1 })
        .then(() => {
          callback({
            restaurant: restaurant.toJSON(),
            isFavorited, isLiked
          })
        })
    })
      .catch(err => res.send(err))
  },
  topTen: async (req, res, callback) => {
    try {
      const userId = helpers.getUser(req).id
      const rankLimit = 10
      let restaurants = await Restaurant.findAll({
        include: [Category, { model: User, as: 'FavoritedUsers' }],
        attributes: {
          include: [
            [
              sequelize.literal('(SELECT COUNT(*) FROM Favorites WHERE Favorites.RestaurantId = Restaurant.id GROUP BY favorites.RestaurantId)'), 'favoriteCount'
            ]
          ]
        },
        order: [
          [sequelize.literal('favoriteCount'), 'DESC']
        ],
        limit: rankLimit
      })
      restaurants = restaurants.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 20),
        favoriteCount: r.FavoritedUsers.length,
        isFavorited: r.FavoritedUsers.map(d => d.id).includes(userId)
      }))
      restaurants = restaurants.sort((a, b) => b.favoriteCount - a.favoriteCount)
      restaurants = restaurants.slice(0, rankLimit)
      return callback({ restaurants })
    } catch (e) {
      callback(e)
    }
  },
  getFeeds: (req, res, callback) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [Category]
      }),
      Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
    ]).then(([restaurants, comments]) => {
      return callback({
        restaurants: restaurants,
        comments: comments
      })
    })
  },
  getDashboard: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      return callback({ restaurant: restaurant.toJSON() })
    })
  }
}

module.exports = restService