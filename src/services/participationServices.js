const { Op } = require('sequelize')
const db = require('../models')
const UserService = require('../services/userServices')
const md5 = require('md5');
// const Raffle = db.raffle
const Participation = db.participation
// const User = db.user

exports.getCountReg = async function (raffleId) {
  try {
    const count = await Participation.count({
      where: {
        raffle_id: raffleId,
        [Op.or]: [
          { status: 0 },
          { status: 1 }
        ]
      }
    })

    return count
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.getBotParticipation = async function (raffleId, telegramId) {
  try {
    const user = await UserService.getUserByTelegramId(telegramId)

    const part = await Participation.findOne({
      where: {
        user_id: user.id,
        raffle_id: raffleId
      }
    })

    return part
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.getCountWin = async function (raffleId) {
  try {
    const count = await Participation.count({
      where: {
        raffle_id: raffleId,
        status: 2
      }
    })

    return count
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.addPartRaffle = async function (raffleId, telegramId) {
  try {
    if (await exports.getBotParticipation(raffleId, telegramId) !== null) {
      const errorMessage = { status: 400, message: 'Participation already exists' }
      throw errorMessage
    }

    const user = await UserService.getUserByTelegramId(telegramId)

    await Participation.create({
      raffle_id: raffleId,
      user_id: user.id,
      status: 1
    })

    return 1
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.removePartRaffle = async function (raffleId, telegramId) {
  try {
    if (await exports.getBotParticipation(raffleId, telegramId) === null) {
      const errorMessage = { status: 400, message: 'Participation doesn\'t exists' }
      throw errorMessage
    }

    const user = await UserService.getUserByTelegramId(telegramId)

    await Participation.destroy({
      where: {
        raffle_id: raffleId,
        user_id: user.id,
        status: 1
      }
    })

    return 1
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.confirmSuccess = async function (raffleId, telegramId) {
  try {
    if (await exports.getBotParticipation(raffleId, telegramId) == null) {
      const errorMessage = { status: 400, message: 'Participation doesn\'t exists' }
      throw errorMessage
    }

    const user = await UserService.getUserByTelegramId(telegramId)
    
    const successHash = md5(raffleId + telegramId + new Date().getTime() + Math.random().toString(36).substring(10))

    const part = await Participation.update({ status: 2, successHash }, {
      where: {
        raffle_id: raffleId,
        user_id: user.id,
        status: 0 || 1
      }
    })

    if (part[0] === 1) {
      return 1
    } else {
      const errorMessage = { status: 400, message: 'Success is already confirmed' }
      throw errorMessage
    }
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.confirmLoss = async function (raffleId, telegramId) {
  try {
    if (await exports.getBotParticipation(raffleId, telegramId) == null) {
      const errorMessage = { status: 400, message: 'Participation doesn\'t exists' }
      throw errorMessage
    }

    const user = await UserService.getUserByTelegramId(telegramId)

    const part = await Participation.update({ status: 3 }, {
      where: {
        raffle_id: raffleId,
        user_id: user.id,
        status: 0 || 1
      }
    })

    if (part[0] === 1) {
      return 1
    } else {
      const errorMessage = { status: 400, message: 'Success is already confirmed' }
      throw errorMessage
    }
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}
