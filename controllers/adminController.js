const fs = require('fs')
const db = require('../models')
const Restaurant = db.Restaurant
const User = db.User
const Category = db.Category
const userController = require('./userController')
const imgur = require('imgur-node-api')
const adminService = require('../services/adminService.js')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID


const adminController = {
  getRestaurants: (req, res) => {
    adminService.getRestaurants(req, res, (data) => {
      return res.render('admin/restaurants', data)
    })
  },
  getRestaurant: (req, res) => {
    adminService.getRestaurant(req, res, (data) => {
      return res.render('admin/restaurant', data)
    })
  },
  createRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      return res.render('admin/create', { categories })

    })
      .catch(error => console.log(error))
  },
  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('back')
      }
      req.flash('success_messages', data['message'])
      res.redirect('/admin/restaurants')
    })
  },
  editRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      return Restaurant.findByPk(req.params.id).then(restaurant => {
        return res.render('admin/create', {
          categories: categories,
          restaurant: restaurant.toJSON()
        })
      })
    })
      .catch(error => console.log(error))
  },
  putRestaurant: (req, res) => {
    adminService.putRestaurant(req, res, (data) => {
      if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('back')
      }
      req.flash('success_messages', data['message'])
      res.redirect('/admin/restaurants')
    })
  },
  deleteRestaurant: (req, res) => {
    adminService.deleteRestaurant(req, res, (data) => {
      if (data['status'] === 'success') {
        return res.redirect('/admin/restaurants')
      }
    })
  },
  getUsers: (req, res) => {
    return User.findAll({ raw: true }).then(users => { return res.render('admin/users', { users }) })
  },
  toogleAdmin: (req, res) => {
    return User.findByPk(req.params.id)
      .then(user => {
        user.update({ ...user, isAdmin: user.isAdmin ? 0 : 1 })
          .then(user => {
            req.flash('success_messages', `User ${user.name} was updated to ${user.isAdmin ? 'admin' : 'user'} successfully.`)
            res.redirect('/admin/users')
          })
      })
      .catch(error => console.log(error))
  }
}
module.exports = adminController
