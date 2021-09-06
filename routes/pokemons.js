const express = require('express')
const {
  getEvolutionChain,
  getPokemonsFromType,
  getPokemons,
  getLegendaryPokemons,
  getMythicalPokemons,
} = require('../controllers/pokemons.js')

const router = express.Router()

router.route('/').get(getPokemons)
router.route('/legendary/').get(getLegendaryPokemons)
router.route('/mythical/').get(getMythicalPokemons)
router.route('/chain/:pokemonId').get(getEvolutionChain)
router.route('/type/:typeId').get(getPokemonsFromType)

module.exports = router
