const express = require('express')
const {
  pokemon_0,
  evolutionChain,
} = require('../controllers/pokemons.js')

const router = express.Router()

router.route('/').get(pokemon_0)
router.route('/chain/:pokemonId').get(evolutionChain)

module.exports = router
