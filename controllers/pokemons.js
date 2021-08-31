const asyncHandler = require('../middleware/async')
const Pokedex = require('pokedex-promise-v2')
const ErrorResponse = require('../utils/errorResponse')

const P = new Pokedex()

// @desc To get hello world
// @route GET /api/v1/pokemon/
// @access public
module.exports.pokemon_0 = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, text: 'Hello world' })
})

// @desc To get pokemons in a evolutionchain
// @route GET /api/v1/pokemon/chain/:pokemonId
// @access public
module.exports.evolutionChain = asyncHandler(
  async (req, res, next) => {
    const pokemonId = req.params.pokemonId
    const pokemon = await P.getPokemonSpeciesByName(pokemonId)
      .then((response) => {
        console.log(pokemon)
        if (!pokemon || pokemon == {}) {
          return next(
            new Errorpokemon(
              `Species not found with id ${pokemonId}`,
              404
            )
          )
        } else {
          return pokemon
        }
      })
      .then((pokemon) => {
        res.status(200).json({ data: pokemon })
      })
      .catch(function (error) {
        return next(
          new ErrorResponse(
            `Species not found with id ${pokemonId}`,
            404
          )
        )
      })
  }
)
