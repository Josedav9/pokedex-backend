const express = require('express')
const {
  pokemon_0,
  getEvolutionChain,
  getPokemonsFromType,
} = require('../controllers/pokemons.js')

const router = express.Router()

router.route('/').get(pokemon_0)
router.route('/chain/:pokemonId').get(getEvolutionChain)
router.route('/type/:typeId').get(getPokemonsFromType)

module.exports = router
