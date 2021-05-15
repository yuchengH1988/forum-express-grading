const db = require('../models')
const { User, Comment, Restaurant, Favorite, Like, Followship } = db
const imgur = require('imgur-node-api')
const helpers = require('../_helpers')

const userService = {
  getTopUser: (req, res, callback) => {
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      // 整理 users 資料
      users = users.map(user => ({
        ...user.dataValues,
        // 計算追蹤者人數
        FollowerCount: user.Followers.length,
        // 判斷目前登入使用者是否已追蹤該 User 物件
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      // 依追蹤者人數排序清單
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return callback({ users: users })
    })
  },
  getUser: async (req, res, callback) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{ model: Comment, include: [Restaurant] },
        { model: User, as: 'Followings' }, { model: User, as: 'Followers' }, { model: Restaurant, as: 'FavoritedRestaurants' }]
      })

      const followings = user.dataValues.Followings.map((following) => ({
        followingId: following.id,
        followingImage: following.image
      }))

      const followers = user.dataValues.Followers.map((follower) => ({
        followerId: follower.id,
        followerImage: follower.image
      }))

      const comments = user.dataValues.Comments.map((el) => ({
        restaurantId: el.Restaurant.id,
        restaurantImage: el.Restaurant.image
      }))

      const favoritedRestaurants = user.dataValues.FavoritedRestaurants.map((restaurant) => ({
        restaurantId: restaurant.id,
        restaurantImage: restaurant.image
      }))

      callback({ profile: user.toJSON(), comments, followings, followers, favoritedRestaurants })
    } catch (err) { console.log(err) }
  },
  editUser: (req, res, callback) => {
    return User.findByPk(req.params.id).then(user => {
      return callback({ user: user.toJSON() })
    })
  },
  putUser: (req, res, callback) => {
    if (!req.body.name) {
      callback({
        status: 'error', message: "name didn/'t exist"
      })
    }
    const { name } = req.body
    const id = req.params.id
    const { file } = req

    if (file) {
      imgur.setClientID(process.env.IMGUR_CLIENT_ID);
      imgur.upload(file.path, (err, img) => {
        return User.findByPk(id)
          .then((user) => {
            return user.update({
              name,
              image: file ? img.data.link : user.image,
            })
              .then((user) => {
                return callback({ status: 'success', message: 'user was successfully to update' })
              })
          })
      })
    } else {
      return User.findByPk(id)
        .then(user => {
          return user.update({ name, image: user.image })
            .then(user => {
              return callback({ status: 'success', message: 'user was successfully to update' })
            })
        })
        .catch(err => console.log(err))
    }
  },
  addFavorite: (req, res, callback) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return callback({ status: 'success', message: 'New Favorite has built successfully.' })
      })
  },
  removeFavorite: (req, res, callback) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: ' Favorite has deleted successfully.' })
          })
      })
  },
  addLike: (req, res, callback) => {
    return Like.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return callback({ status: 'success', message: 'New like has built successfully.' })
      })
  },
  removeLike: (req, res, callback) => {
    return Like.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((like) => {
        like.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: ' Like has deleted successfully.' })
          })
      })
  },
  addFollowing: (req, res, callback) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return callback({ status: 'success', message: 'New Followship has built successfully.' })
      })
  },
  removeFollowing: (req, res, callback) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return callback({ status: 'success', message: ' Followship has deleted successfully.' })
          })
      })
  }
}


module.exports = userService