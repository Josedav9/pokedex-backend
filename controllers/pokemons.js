const asyncHandler = require('../middleware/async')
const Pokedex = require('pokedex-promise-v2')
const ErrorResponse = require('../utils/errorResponse')
const axios = require('axios')

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
    await P.getPokemonSpeciesByName(pokemonId)
      .then((pokemon) => {
        const evolutionChainUrl = pokemon.evolution_chain.url

        axios.get(evolutionChainUrl).then(async (response) => {
          const evolutionChain = response.data.chain
          let evolutions = getEvolutionsFromChain(evolutionChain, [])
          const responses = await axios.all(
            evolutions.map((evolution) => axios.get(evolution.url))
          )
          const evolutionsDetails = responses.map(
            (response) => response.data
          )
          res.status(200).json({
            success: true,
            evolutions,
            species: evolutionsDetails,
          })
        })
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

const getEvolutionsFromChain = (chainRoot, evolutionsList) => {
  evolutionsList.push(chainRoot.species)
  let subChain = chainRoot.evolves_to
  if (subChain.length == 0) {
    return evolutionsList
  }
  return getEvolutionsFromChain(subChain[0], evolutionsList)
}
