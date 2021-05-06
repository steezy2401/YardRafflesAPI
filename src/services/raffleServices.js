const { Op } = require('sequelize')
const db = require('../models')
const Raffle = db.raffle
const Tags = db.tags
// const User = db.user
const Participation = db.participation
const _ = require('lodash')

// const ParticipationService = require('./participationServices')
const UserService = require('./userServices')

exports.getRaffleList = async function (page, limit, sort = 'id', sortDir = 'desc', search = '') {
  console.log(sort)

  try {
    const checkRaffles = await Raffle.count()

    if (!checkRaffles) {
      return []
    }

    const options = {
      where: {
        [Op.or]: [
          { itemTitle: { [Op.like]: '%' + search + '%' } },
          { work_name: { [Op.like]: '%' + search + '%' } },
          { message: { [Op.like]: '%' + search + '%' } },
          { profit: { [Op.like]: '%' + search + '%' } }
        ]
      },
      subQuery: false,
      attributes: [
        'id',
        'itemTitle',
        'work_name',
        'images',
        'message',
        'link',
        'sizes',
        'publication_date',
        'publish',
        'close_date',
        'results_date',
        'status',
        'profit',
        [db.sequelize.fn('COUNT', db.sequelize.col('participation.id')), 'reg_count'],
        [db.sequelize.fn('COUNT', db.sequelize.col('participation2.id')), 'win_count']
      ],
      group: ['id'],
      include: [
        {
          model: Tags,
          as: 'tags',
          through: { attributes: [] },
          attributes: [
            'id',
            'itemTitle'
          ],
          required: false
        },
        {
          model: Participation,
          as: 'participation',
          where: {
            [Op.or]: [
              { status: 0 },
              { status: 1 }
            ]
          },
          attributes: [],
          required: false
        },
        {
          model: Participation,
          as: 'participation2',
          where: {
            status: 2
          },
          attributes: [],
          required: false
        }
      ],
      order: [
        [sort, sortDir]
      ]
    }

    if (limit !== undefined) {
      options.limit = limit
    }

    if (limit !== undefined && page !== undefined) {
      options.offset = limit * (page - 1)
    }

    const raffles = await Raffle.findAndCountAll(options)

    raffles.count = _.get(raffles, 'count.length')

    return raffles
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}

exports.getRaffleData = async function (id) {
  try {
    let raffle = await exports.getRaffleById(id)

    raffle = raffle.toJSON()

    raffle.reg_users = await UserService.getRegedUsers(id)
    raffle.win_users = await UserService.getWinUsers(id)

    return raffle
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting the Raffle.' }
    throw errorMessage
  }
}

exports.getRaffleById = async function (id) {
  try {
    const raffle = await Raffle.findByPk(id, {
      include: [
        {
          model: Tags,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    })

    if (!raffle) {
      const errorMessage = { status: 404, message: 'Raffle not found' }
      throw errorMessage
    }

    return raffle
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting the Raffle.' }
    throw errorMessage
  }
}

exports.deleteRaffle = async function (id) {
  try {
    const raffle = await Raffle.destroy({
      where: {
        id: id
      }
    })

    if (raffle === 1) {
      return true
    } else {
      const errorMessage = { status: 404, message: 'Not found in the database' }
      throw errorMessage
    }
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting the Raffle.' }
    throw errorMessage
  }
}

exports.createRaffle = async function (newRaffle, tags) {
  try {
    const result = await db.sequelize.transaction(async (t) => {
      const createRaffle = await Raffle.create(newRaffle, {
        include: [Tags],
        transaction: t
      })

      await createRaffle.addTag(tags, { transaction: t })

      return createRaffle
    })

    return await exports.getRaffleById(result.id)
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while creating the Raffle.' }
    throw errorMessage
  }
}

exports.updateRaffle = async function (id, updateRaffle, tags) {
  try {
    const result = await db.sequelize.transaction(async (t) => {
      const oldRaffle = await exports.getRaffleById(id)

      const raffle = await Raffle.update(updateRaffle, {
        where: {
          id: id
        },
        include: [Tags],
        transaction: t
      })

      console.log(tags)
      if (tags !== undefined) {
        await oldRaffle.setTags(tags, { transaction: t })
      }

      return raffle
    })

    if (result[0] === 1) {
      return await exports.getRaffleById(id)
    } else {
      const errorMessage = { status: 404, message: 'Not found in the database' }
      throw errorMessage
    }
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message }
    throw errorMessage
  }
}

exports.getRafflesToPost = async function () {
  try {
    const checkRaffles = await Raffle.count()

    if (!checkRaffles) {
      return []
    }

    const raffles = await db.sequelize.transaction(async (t) => {
      const raffles = await Raffle.findAll({
        where: {
          publish: 1,
          status: 0,
          publication_date: {
            [Op.lt]: new Date(Date.now())
          }
        },
        transaction: t
      })

      await Raffle.update({ status: 1 }, {
        where: {
          publish: 1,
          status: 0,
          publication_date: {
            [Op.lt]: new Date(Date.now())
          }
        },
        transaction: t
      })

      return raffles
    })

    return raffles
  } catch (err) {
    const errorMessage = { status: err.status || 500, message: err.message || 'Some error occurred while getting Raffles.' }
    throw errorMessage
  }
}
