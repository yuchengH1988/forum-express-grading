'use strict'

const faker = require('faker')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await User.findAll()
    const restaurants = await Restaurant.findAll()
    await queryInterface.bulkInsert('Comments',
      Array.from({ length: 15 }).map((_, index) => ({
        id: index * 10 + 1,
        text: faker.lorem.text().substring(0, 15),
        UserId: users[Math.floor(Math.random() * users.length)].id,
        RestaurantId: restaurants[Math.floor(Math.random() * restaurants.length)].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      , {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
};
