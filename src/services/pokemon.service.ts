import axios from "axios";
import {
  PokeApiGeneration,
  PokeApiInfoDTO,
} from "../controllers/dto/pokemon.dto";
import {
  PokemonInfo,
  Pagination,
} from "../controllers/interfaces/pokemon.interface";

const BASE_URL = process.env.BASE_URL;

export const getPokemonBygeneration = async (
  generation: string,
  limit: number,
  offset: number
) => {
  const pokemonByGeneration = await axios.get<PokeApiGeneration>(
    `${BASE_URL}/generation/${generation}`,
    {
      params: {
        limit,
        offset,
      },
    }
  );

  const totalData = pokemonByGeneration.data.pokemon_species.length;
  const species = pokemonByGeneration.data.pokemon_species.slice(offset, limit);

  const pagination = createPaginationObject(limit, offset, totalData);

  const pokemons = await axios.all(
    species.map((specie) =>
      axios.get<PokeApiInfoDTO>(`${BASE_URL}/pokemon/${specie.name}`)
    )
  );

  //Purify data
  const pokemonDetails = pokemons.map(({ data }) => {
    return removeUnnecesaryFieldsFromPokemon(data);
  });

  return { pokemonDetails, pagination };
};

export const removeUnnecesaryFieldsFromPokemon = ({
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

export const createPaginationObject = (
  limit: number,
  offset: number,
  total: number
) => {
  const startIndex = offset * limit;
  let endIndex = (offset + 1) * limit
  if (endIndex > total) endIndex = total;

  // Pagination result
  const pagination: Pagination = { startIndex, endIndex };

  if (endIndex < total) {
    pagination.next = {
      page: offset + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: offset - 1,
      limit,
    };
  }
  return pagination;
};
