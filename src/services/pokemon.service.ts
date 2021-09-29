import axios from "axios";
import { assert } from "console";
import { createPaginationObject } from "../controllers/misc/pagination";
import {
  PokeApiEvolutionChainDTO,
  PokeApiGeneration,
  PokeApiInfoDTO,
  PokeApiListDTO,
  PokeApiSpeciesInfoDTO,
  PokeApiTypeListDTO,
} from "../controllers/dto/pokemon.dto";
import {
  PokemonInfo,
  PokemonSpecieInfo,
  PokemonDetails,
} from "../controllers/interfaces/pokemon.interface";
import { off } from "process";

const BASE_URL = process.env.BASE_URL;

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


const _getListFromType = (typeId: string, limit:number,offset: number) => {
  return axios.get<PokeApiTypeListDTO>(BASE_URL + "/type/" + typeId);
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

const getPokemonResponse = (pokemonIdOrName: string | number) => {
  return axios.get<PokeApiInfoDTO>(BASE_URL + "/pokemon/" + pokemonIdOrName);
};

const getSpeciesResponse = (pokemonIdOrName: string | number) => {
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

export const getPokemonByEvoutionChain = async (
  pokemonId,
) =>{
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

  return cleanedPokemonInEvolutionchain;
}



export const getPokemonByType = async (
  typeId,
  limit: number,
  offset: number
)=>{
  const pokemonsFromTypeResponse = await _getListFromType(typeId,limit,offset);

  const pokemonsFromType = pokemonsFromTypeResponse.data.pokemon.map(
    (value) => value.pokemon
  );

    // Pagination
    const total = pokemonsFromType.length;
    const pagination = createPaginationObject(limit, offset, total);

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

    return {pokemonDetails, pagination};
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
  const species = pokemonByGeneration.data.pokemon_species.slice(offset, limit+offset);

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








