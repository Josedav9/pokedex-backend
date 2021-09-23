import { PokemonInfo } from "../interfaces/pokemon.interface";

export interface PokeApiListDTO {
  count: number;
  next: string;
  previus?: string;
  results: {
    name: string;
    url: string;
  }[];
}

export interface PokeApiInfoDTO {
  id: number;
  name: string;
  order: number;
  sprites: {
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  }; // Image url,
  types: {
    type: {
      url: string;
      name: string;
    };
  }[];
}

export interface PokeApiSpeciesInfoDTO {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_swichable: boolean;
  growth_rate: {
    name: string;
    url: string;
  };
  pokedex_numbers: object[];
  egg_groups: object[];
  color: {
    name: string;
    url: string;
  };
  shape: {
    name: string;
    url: string;
  };
  evolves_from_species: object | null;
  evolution_chain: { url: string };
  habitat: {
    name: string;
    url: string;
  };
  generation: {
    name: string;
    url: string;
  };
  names: object[];
  flavor_text_entries: object[];
  form_descriptions: object[];
  genera: object[];
  varieties: object[];
  pal_park_encounters: object[];
}
export interface PokeApiTypeListDTO {
  id: number;
  name: string;
  damage_relations: object;
  game_indices: object[];
  generation: {
    name: string;
    url: string;
  };
  move_damage_class: object;
  names: object[];
  pokemon: {
    slot: string;
    pokemon: {
      name: string;
      url: string;
    };
  }[];
  moves: object[];
}

export interface PokeApiEvolutionChainDTO {
  baby_trigger_item: object;
  chain: {
    evolution_details: object[];
    evolves_to: EvolvesTo[];
    is_baby: false;
    species: {
      name: string;
      url: string;
    };
  };
  id: number;
}

export interface EvolvesTo {
  evolution_details: object[];
  evolves_to: EvolvesTo[];
  is_baby: false;
  species: {
    name: string;
    url: string;
  };
}

export interface PokeApiGeneration {
  id: number;
  name: string;
  abilities: object[];
  names: object [];
  main_region: object;
  moves: object[];
  pokemon_species: {
    name: string,
    url: string,
  }[],
  types: object[],
  version_groups: object[],
}
