const RaffleService = require('../services/raffleServices')
const TagsService = require('../services/tagServices')

exports.getRaffleList = async function (req, res, next) {
  let page = req.params.page

  let 
    limit = parseInt(req.query.limit) || 10,
    sort = req.query.sort,
    sort_dir = req.query.sort_dir,
    search = req.query.search


  try {
    let raffles = await RaffleService.getRaffleList(page, limit, sort, sort_dir, search)
    res.json({ data: raffles })
  } catch (err) {
    next(err)
  }
}

exports.getRaffleData = async function (req, res, next) {
  let id = req.params.id

  try {
    let raffle = await RaffleService.getRaffleById(id)
    res.json({ data: raffle })
  } catch (err) {
    next(err)
  }
}

exports.createRaffle = async function (req, res, next) {
  let newRaffle = {
    "title": req.body.title,
    "work_name": req.body.work_name,
    "images": req.body.images,
    "message": req.body.message,
    "link": req.body.link,
    "sizes": req.body.sizes,
    "publication_date": req.body.publication_date,
    "close_date": req.body.close_date,
    "results_date": req.body.results_date,
    "profit": req.body.profit
  }

  let tags = req.body.tags

  try {
    await TagsService.checkTags(tags);

    let raffle = await RaffleService.createRaffle(newRaffle, tags)
    res.json({ data: raffle })
  } catch (err) {
    next(err)
  }
}

exports.updateRaffle = async function (req, res, next) {
  let id = req.params.id

  let updateRaffle = {
    "title": req.body.title,
    "work_name": req.body.work_name,
    "images": req.body.images,
    "message": req.body.message,
    "link": req.body.link,
    "sizes": req.body.sizes,
    "publication_date": req.body.publication_date,
    "close_date": req.body.close_date,
    "results_date": req.body.results_date,
    "profit": req.body.profit
  }

  let tags = req.body.tags

  try {
    await TagsService.checkTags(tags);

    let raffle = await RaffleService.updateRaffle(id, updateRaffle, tags)
    res.json({ data: raffle })
  } catch (err) {
    next(err)
  }
}

exports.deleteRaffle = async function (req, res, next) {
  let id = req.params.id

  try {
    let raffle = await RaffleService.deleteRaffle(id)
    res.json({ data: 1 })
  } catch (err) {
    next(err)
  }
}