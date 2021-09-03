const asyncHandler = require('../middleware/async')
const Pokedex = require('pokedex-promise-v2')
const ErrorResponse = require('../utils/errorResponse')
const axios = require('axios')
const { raw } = require('express')

const P = new Pokedex()

const BASE_URL = 'https://pokeapi.co/api/v2'

// @desc To get hello world
// @route GET /api/v1/pokemon/
// @access public
module.exports.pokemon_0 = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, text: 'Hello world' })
})

// @desc To get pokemons in a evolutionchain
// @route GET /api/v1/pokemon/chain/:pokemonId
// @access public
module.exports.getEvolutionChain = asyncHandler(
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

// @desc To get pokemons of a type
// @route GET /api/v1/pokemon/type/:typeId
// @access public
module.exports.getPokemonsFromType = asyncHandler(
  async (req, res, next) => {
    const typeId = req.params.typeId
    // Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 25
    const startIndex = (page - 1) * limit
    let endIndex = page * limit

    const pokemonsFromTypeResponse = await axios
      .get(BASE_URL + '/type/' + typeId)
      .catch(function (error) {
        return next(
          new ErrorResponse(`Type not found with id ${typeId}`, 404)
        )
      })

    const pokemonsFromType =
      pokemonsFromTypeResponse.data.pokemon.map((value) => {
        return value.pokemon
      })

    console.log('pokemonsFromType', pokemonsFromType)

    if (!pokemonsFromType) {
      return next(
        new ErrorResponse(`Type not found with id ${typeId}`, 404)
      )
    } else {
      if (endIndex > pokemonsFromType.length)
        endIndex = pokemonsFromType.length

      // Pagination result
      const pagination = {}

      if (endIndex < pokemonsFromType.length) {
        pagination.next = {
          page: page + 1,
          limit,
        }
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit,
        }
      }
      const pokemon = pokemonsFromType.slice(startIndex, endIndex)
      const responses = await axios.all(
        pokemon.map(async (pokemon) => await axios.get(pokemon.url))
      )

      const pokemonDetails = responses.map((response) => {
        const raw_data = response.data
        delete raw_data.game_indices
        delete raw_data.held_items
        delete raw_data.past_types
        return raw_data
      })

      res.status(200).json({
        success: true,
        pagination,
        data: {
          count: pokemon.length,
          pokemon: pokemonDetails,
        },
      })
    }
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
