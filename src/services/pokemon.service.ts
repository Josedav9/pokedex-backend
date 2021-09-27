import axios from "axios";
import { assert } from "console";
import {
  PokeApiGeneration,
  PokeApiInfoDTO,
  PokeApiListDTO,
  PokeApiSpeciesInfoDTO,
  PokeApiTypeListDTO,
} from "../controllers/dto/pokemon.dto";
import {
  PokemonInfo,
  Pagination,
  PokemonSpecieInfo,
} from "../controllers/interfaces/pokemon.interface";

const BASE_URL = process.env.BASE_URL;

export const getPokemonList = async (
  limit: number,
  offset: number
)=>{

  const pokemonList = await _getPokemonListRaw(limit,offset)

  //Get all pokemon within boundaries
  const pokemonResponses = await axios.all(
    pokemonList.map((pokemon) => axios.get<PokeApiInfoDTO>(pokemon.url))
  );

  //Purify pokemon data
  const pokemonInfo = pokemonResponses.map((response) => {
    return removeUnnecesaryFieldsFromPokemon(response.data);
  });

  return pokemonInfo;
}


const _getPokemonListRaw = async (limit: number, offset:number) => {
  const pokemonListResponse = await axios.get<PokeApiListDTO>(BASE_URL + "/pokemon/", {
    params: {
      limit,
      offset,
    },
  });

  const pokemonList = pokemonListResponse.data.results;
  return pokemonList;
}

export const getSpecialPokemonList = async (
limit: number,offset:number,specialField: string
) => {
  const pokemonListRaw = await _getPokemonListRaw(limit,offset)
  assert(specialField == 'is_legendary' || specialField == 'is_mythical' )
  
  //Get all species within boundaries
  const speciesResponses = await axios.all(
    pokemonListRaw.map((pokemon) =>
      axios.get<PokeApiSpeciesInfoDTO>(
        pokemon.url.replace("pokemon", "pokemon-species")
      )
    )
  );

   //Filter special pokemons
   const speciesDetails = speciesResponses
   .map(({ data }) => {
     return removeUnnecesaryFieldsFromSpecies(data);
   })
   .filter((pokemon) => pokemon[specialField]);

   const pokemonInfo = await getPokemonFromSpeciesDetails(speciesDetails);

   return pokemonInfo;

}



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
    imageUrl: sprites.other["official-artwork"].front_default,
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


export const getListFromType = (typeId: string) => {
  return axios.get<PokeApiTypeListDTO>(BASE_URL + "/type/" + typeId);
};


export const getPokemonResponse = (pokemonIdOrName: string | number) => {
  return axios.get<PokeApiInfoDTO>(BASE_URL + "/pokemon/" + pokemonIdOrName);
};

export const getSpeciesResponse = (pokemonIdOrName: string | number) => {
  return axios.get<PokeApiSpeciesInfoDTO>(
    BASE_URL + "/pokemon-species/" + pokemonIdOrName
  );
};

const getPokemonFromSpeciesDetails = async (
  speciesDetails: PokemonSpecieInfo[]
) => {
  //Get pokemon details
  const pokemonResponses = await axios.all(
    speciesDetails.map((species) => {
      return getPokemonResponse(species.name);
    })
  );

  //Purify pokemon data
  const pokemonDetails = pokemonResponses.map((response) => {
    return removeUnnecesaryFieldsFromPokemon(response.data);
  });

  return pokemonDetails;
};

const removeUnnecesaryFieldsFromSpecies = (pokemon: PokeApiSpeciesInfoDTO) => {
  delete pokemon.base_happiness;
  delete pokemon.capture_rate;
  delete pokemon.flavor_text_entries;
  delete pokemon.form_descriptions;
  delete pokemon.genera;
  delete pokemon.names;
  delete pokemon.pal_park_encounters;
  delete pokemon.pokedex_numbers;
  delete pokemon.varieties;

  // Since it deleted some keys from the DTO it is necesary to cast it as unknow to be able to set the new type
  const pokemonInfoCleaned = pokemon as unknown as PokemonSpecieInfo;

  return pokemonInfoCleaned;
};