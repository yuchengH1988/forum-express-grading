const db = require('../models')
const Comment = db.Comment

const commentService = {
  postComment: async (req, res, callback) => {
    try {
      await Comment.create({
        text: req.body.text,
        RestaurantId: req.body.restaurantId,
        UserId: req.user.id
      })
      callback({ status: 'success', message: 'Comment has built successfully.' })
    } catch (e) { console.log(e) }
  },
  deleteComment: async (req, res, callback) => {
    try {
      const comment = await Comment.findByPk(req.params.id)
      await comment.destroy()
      callback({ status: 'success', message: 'Comment has deleted successfully.' })
    } catch (e) { console.log(e) }
  }
}

module.exports = commentService