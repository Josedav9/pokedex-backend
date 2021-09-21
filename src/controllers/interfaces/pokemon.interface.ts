export interface Pagination {
  next?: {
    page: number,
    limit: number;
  };
  prev?: {
    page: number,
    limit: number;
  };
  startIndex: number,
  endIndex: number,
}

export interface PokemonDetails {
  name: string,
  url: string,
}

export interface PokemonInfo {
  id: number;
  name: string;
  order: number;
  sprite: string; // Image url,
  types: string[];
}

export interface PokemonSpecieInfo {
  color: {
    name: string;
    url: string;
  };
  egg_groups: object[];
  evolution_chain: { url: string };
  evolves_from_species: object | null;
  forms_switchable: boolean;
  gender_rate: number;
  generation: {
    name: string;
    url: string;
  };
  growth_rate: {
    name: string;
    url: string;
  };
  habitat: {
    name: string;
    url: string;
  };
  has_gender_differences: boolean;
  hatch_counter: number;
  id: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  name: string;
  order: number;
  shape: {
    name: string;
    url: string;
  };
}
