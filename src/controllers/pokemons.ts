import { ErrorResponse } from "../utils/errorResponse";
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import {
  PokeApiEvolutionChainDTO,
  PokeApiInfoDTO,
  PokeApiListDTO,
  PokeApiSpeciesInfoDTO,
  PokeApiTypeListDTO,
} from "./dto/pokemon.dto";
import {
  Pagination,
  PokemonInfo,
  PokemonSpecieInfo,
  PokemonDetails,
} from "./interfaces/pokemon.interface";

import { getListFromType, getPokemonBygeneration, getPokemonList, getPokemonResponse, getSpecialPokemonList, getSpeciesResponse } from "../services/pokemon.service";

const BASE_URL = "https://pokeapi.co/api/v2";



/**
 * Gets a list of pokemon with pagination & limits
 * @route GET /api/v1/pokemon/
 * @access public
 */
export const getPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = parseInt(req.query.limit as string);
  const offset = parseInt(req.query.offset as string);

  try {
    const pokemonList = await getPokemonList(limit,offset);

    //Respond
    res.status(200).json({
      success: true,
      data: {
        count: pokemonList.length,
        pokemon: pokemonList,
      },
    });
  } catch (error) {
    return next(new ErrorResponse(`Unexpected error`, 400));
  }
};

/**
 * Gets a list of legendary pokemons with limit and offset
 * @route GET /api/v1/pokemon/legendary/
 * @access public
 */
export const getLegendaryPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = parseInt(req.query.limit as string);
  const offset = parseInt(req.query.offset as string);

  try {

    const pokemonList = await getSpecialPokemonList(limit,offset,'is_legendary')

    //Respond
    res.status(200).json({
      success: true,
      data: {
        count: pokemonList.length,
        pokemon: pokemonList,
      },
    });
  } catch (error) {
    return next(new ErrorResponse(`Unexpected error`, 400));
  }
};

/**
 * Gets a list of mythical pokemons with limit and offset
 * @route GET /api/v1/pokemon/mythical/
 * @access public
 */
export const getMythicalPokemons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = parseInt(req.query.limit as string);
  const offset = parseInt(req.query.offset as string);

  try {

    const pokemonList = await getSpecialPokemonList(limit,offset,'is_mythical')

    //Respond
    res.status(200).json({
      success: true,
      data: {
        count: pokemonList.length,
        pokemon: pokemonList,
      },
    });
  } catch (error) {
    return next(new ErrorResponse(`Unexpected error`, 400));
  }
};

/**
 * Gets pokemons in a evolutionchain
 * @route GET /api/v1/pokemon/chain/:pokemonId
 * @access public
 */
export const getEvolutionChain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pokemonId = req.params.pokemonId;
  const pokemonSpecies = await getSpeciesResponse(pokemonId);

  const evolutionchainInfo = await axios.get<PokeApiEvolutionChainDTO>(
    pokemonSpecies.data.evolution_chain.url
  );

  const pokemonNames: PokemonDetails[] = [];

  // Store all evolution inside `pokemonNames`
  getEvolutionsFromChain(evolutionchainInfo.data.chain, pokemonNames);

  const pokemonInEvolutionChain = await axios.all(
    pokemonNames.map((pokemon) => getPokemonResponse(pokemon.name))
  );

  const cleanedPokemonInEvolutionchain = pokemonInEvolutionChain.map(
    ({ data }) => removeUnnecesaryFieldsFromPokemon(data)
  );

  //Respond
  res.status(200).json({
    success: true,
    data: {
      count: cleanedPokemonInEvolutionchain.length,
      pokemon: cleanedPokemonInEvolutionchain,
    },
  });
};

/**
 * Gets pokemons of a type
 * @route GET /api/v1/pokemon/type/:typeId
 * @access public
 */
export const getPokemonsFromType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const typeId = req.params.typeId;
  const pokemonsFromTypeResponse = await getListFromType(typeId);

  const pokemonsFromType = pokemonsFromTypeResponse.data.pokemon.map(
    (value) => value.pokemon
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
      pokemon.map((pokemon) => axios.get<PokeApiInfoDTO>(pokemon.url))
    );

    //Purify data
    const pokemonDetails = pokemonResponses.map(({ data }) => {
      return removeUnnecesaryFieldsFromPokemon(data);
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

/**
 * Gets pokemons of a type
 * @route GET /api/v1/pokemon/generation/:generation
 * @access public
 */
export const getPokemonByGeneration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const generation = req.params.generation;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const pokemonList = await getPokemonBygeneration(generation, limit, offset);

    //Respond
    res.status(200).json({
      success: true,
      pagination: pokemonList.pagination,
      data: {
        count: pokemonList.pokemonDetails.length,
        pokemon: pokemonList.pokemonDetails,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse(`Unexpected error`, 400));
  }
};

/**
 * Recursive function to return all pokemons inside a evolution chain
 * @param chainRoot
 * @param evolutionsList
 * @returns evolutionsList - An array with all pokemons info inside the evolution chain
 */
const getEvolutionsFromChain = (
  chainRoot: PokeApiEvolutionChainDTO["chain"],
  evolutionsList: PokemonDetails[]
): PokemonDetails[] => {
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
    imageUrl: sprites.other["official-artwork"].front_default,
    types: types.map((type) => type.type.name),
  };
};



const createPaginationObject = (req: Request, total: number) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 25;
  const startIndex = (page - 1) * limit;
  let endIndex = page * limit;
  if (endIndex > total) endIndex = total;

  // Pagination result
  const pagination: Pagination = { startIndex, endIndex };

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



