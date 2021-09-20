const Pokedex = require("pokedex-promise-v2");
import { ErrorResponse } from "../utils/errorResponse";
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { PokeApiInfoDTO, PokeApiListDTO } from "./dto/pokemon.dto";
import { PokemonInfo } from "./interfaces/pokemon.interface";

const P = new Pokedex();

const BASE_URL = "https://pokeapi.co/api/v2";

// @desc To get hello world
// @route GET /api/v1/pokemon/
// @access public
export const pokemon_0 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ success: true, text: "Hello world" });
};

// @desc To get list of pokemon with pagination & limits
// @route GET /api/v1/pokemon/
// @access public
export const getPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = req.query.limit;
  const offset = req.query.offset;

  try {
    const pokemonListResponse = await getPokemonListResponse(
      limit,
      offset,
      next
    );
    const pokemonList = pokemonListResponse.data.results;

    //Get all pokemon within boundaries
    const pokemonResponses = await axios.all(
      pokemonList.map((pokemon) => axios.get<PokeApiInfoDTO>(pokemon.url))
    );

    //Purify pokemon data
    const pokemonDetails = pokemonResponses.map((response) => {
      return removeUnnecesaryFieldsFromPokemon(response.data);
    });

    //Respond
    res.status(200).json({
      success: true,
      data: {
        count: pokemonDetails.length,
        pokemon: pokemonDetails,
      },
    });
  } catch (error) {
    return next(new ErrorResponse(`Unexpected error`, 400));
  }
};

// @desc To get list of legendary pokemons with limit and offset
// @route GET /api/v1/pokemon/legendary/
// @access public
export const getLegendaryPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = req.query.limit;
  const offset = req.query.offset;

  const pokemonListResponse = await getPokemonListResponse(limit, offset, next);

  const pokemonList = pokemonListResponse.data.results;

  //Get all species within boundaries
  const speciesResponses = await axios.all(
    pokemonList.map((pokemon) =>
      axios.get(pokemon.url.replace("pokemon", "pokemon-species"))
    )
  );

  //Filter legendaries
  const speciesDetails = speciesResponses
    .map((response) => {
      return removeUnnecesaryFieldsFromSpecies(response);
    })
    .filter((pokemon) => pokemon.is_legendary);

  if (speciesDetails.length == 0)
    return next(
      new ErrorResponse(
        `No legendaries found within the limit and offset stablished`,
        404
      )
    );

  const pokemonDetails = await getPokemonFromSpeciesDetails(speciesDetails);

  //Respond
  res.status(200).json({
    success: true,
    data: {
      count: pokemonDetails.length,
      pokemon: pokemonDetails,
    },
  });
};

// @desc To get list of mythical pokemons with limit and offset
// @route GET /api/v1/pokemon/mythical/
// @access public
export const getMythicalPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = req.query.limit;
  const offset = req.query.offset;

  const pokemonListResponse = await getPokemonListResponse(limit, offset, next);

  const pokemonList = pokemonListResponse.data.results;

  //Get all species within boundaries
  const speciesResponses = await axios.all(
    pokemonList.map(
      async (pokemon) =>
        await axios.get(pokemon.url.replace("pokemon", "pokemon-species"))
    )
  );

  //Filter mythical
  const speciesDetails = speciesResponses
    .map((response) => {
      return removeUnnecesaryFieldsFromSpecies(response);
    })
    .filter((pokemon) => pokemon.is_mythical);

  if (speciesDetails.length == 0)
    return next(
      new ErrorResponse(
        `No mythical found within the limit and offset stablished`,
        404
      )
    );

  const pokemonDetails = await getPokemonFromSpeciesDetails(speciesDetails);

  //Respond
  res.status(200).json({
    success: true,
    data: {
      count: pokemonDetails.length,
      pokemon: pokemonDetails,
    },
  });
};

// @desc To get pokemons in a evolutionchain
// @route GET /api/v1/pokemon/chain/:pokemonId
// @access public
export const getEvolutionChain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pokemonId = req.params.pokemonId;
  await P.getPokemonSpeciesByName(pokemonId)
    .then((pokemon) => {
      const evolutionChainUrl = pokemon.evolution_chain.url;

      axios.get(evolutionChainUrl).then(async (response) => {
        const evolutionChain = response.data.chain;
        let evolutions = getEvolutionsFromChain(evolutionChain, []);
        const speciesDetails = await axios.all(
          evolutions.map((evolution) => axios.get(evolution.url))
        );
        const evolutionsDetails = speciesDetails.map((response) =>
          removeUnnecesaryFieldsFromSpecies(response)
        );

        const pokemonDetails = await getPokemonFromSpeciesDetails(
          evolutionsDetails
        );

        //Mix pokemon and species
        const pokemonsAndSpecies = mixPokemonsAndSpecies(
          pokemonDetails,
          evolutionsDetails
        );
        res.status(200).json({
          success: true,
          data: pokemonsAndSpecies,
        });
      });
    })
    .catch(function (error) {
      return next(
        new ErrorResponse(`Species not found with id ${pokemonId}`, 404)
      );
    });
};

// @desc To get pokemons of a type
// @route GET /api/v1/pokemon/type/:typeId
// @access public
export const getPokemonsFromType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const typeId = req.params.typeId;
  const pokemonsFromTypeResponse = await getListFromType(typeId);

  const pokemonsFromType = pokemonsFromTypeResponse.data.pokemon.map(
    (value) => {
      return value.pokemon;
    }
  );

  if (!pokemonsFromType) {
    return next(new ErrorResponse(`Type not found with id ${typeId}`, 404));
  } else {
    // Pagination
    const total = pokemonsFromType.length;

    const pagination = createPaginationObject(req, total);

    //Limit
    const pokemon = pokemonsFromType.slice(
      pagination.startIndex,
      pagination.endIndex
    );

    //Get all pokemon within boundaries
    const pokemonResponses = await axios.all(
      pokemon.map(async (pokemon) => await axios.get(pokemon.url))
    );

    //Purify data
    const pokemonDetails = pokemonResponses.map((response: any) => {
      return removeUnnecesaryFieldsFromPokemon(response.data);
    });

    //Respond
    res.status(200).json({
      success: true,
      pagination,
      data: {
        count: pokemonDetails.length,
        pokemon: pokemonDetails,
      },
    });
  }
};

const getEvolutionsFromChain = (chainRoot, evolutionsList) => {
  evolutionsList.push(chainRoot.species);
  let subChain = chainRoot.evolves_to;
  if (subChain.length == 0) {
    return evolutionsList;
  }
  return getEvolutionsFromChain(subChain[0], evolutionsList);
};

const removeUnnecesaryFieldsFromPokemon = ({
  id,
  name,
  order,
  sprites,
  types,
}: PokeApiInfoDTO): PokemonInfo => {
  return {
    id,
    name,
    order,
    sprite: sprites.other["official-artwork"].front_default,
    types: types.map((type) => type.type.name),
  };
};

const removeUnnecesaryFieldsFromSpecies = (response) => {
  const raw_data = response.data;
  delete raw_data.base_happiness;
  delete raw_data.capture_rate;
  delete raw_data.flavor_text_entries;
  delete raw_data.form_descriptions;
  delete raw_data.genera;
  delete raw_data.names;
  delete raw_data.pal_park_encounters;
  delete raw_data.pokedex_numbers;
  delete raw_data.varieties;

  return raw_data;
};

const createPaginationObject = (req: Request, total) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 25;
  const startIndex = (page - 1) * limit;
  let endIndex = page * limit;
  if (endIndex > total) endIndex = total;

  // Pagination result
  const pagination: any = { startIndex, endIndex };

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }
  return pagination;
};

const getListFromType = async (typeId) => {
  return axios.get(BASE_URL + "/type/" + typeId).catch(function (error) {
    throw error;
  });
};

const getPokemonListResponse = async (limit, offset, next: NextFunction) => {
  limit = limit || 20;
  offset = offset || 0;
  return axios.get<PokeApiListDTO>(BASE_URL + "/pokemon/", {
    params: {
      limit,
      offset,
    },
  });
};

const getPokemonResponse = async (pokemonIdOrName) => {
  return axios.get(BASE_URL + "/pokemon/" + pokemonIdOrName);
};

const getSpeciesResponse = async (pokemonIdOrName) => {
  return axios.get(BASE_URL + "/pokemon-species/" + pokemonIdOrName);
};

const getPokemonFromSpeciesDetails = async (speciesDetails) => {
  //Get pokemon details
  const pokemonResponses = await axios.all(
    speciesDetails.map((species) => {
      return getPokemonResponse(species.name);
    })
  );

  //Purify pokemon data
  const pokemonDetails = pokemonResponses.map((response: any) => {
    return removeUnnecesaryFieldsFromPokemon(response.data);
  });

  return pokemonDetails;
};

const getSpeciesFromPokemonDetails = async (pokemonDetails) => {
  //Get pokemon details
  const speciesResponse = await axios.all(
    pokemonDetails.map((pokemon) => {
      return getSpeciesResponse(pokemon.name);
    })
  );

  //Purify pokemon data
  const speciesDetails = speciesResponse.map((response) => {
    return removeUnnecesaryFieldsFromSpecies(response);
  });

  return speciesDetails;
};

const mixPokemonsAndSpecies = (pokemonDetails, speciesDetails) => {
  return pokemonDetails.map((pokemon, index) => {
    return { ...pokemon, ...speciesDetails[index] };
  });
};
