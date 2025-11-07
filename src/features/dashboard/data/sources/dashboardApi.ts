import { getPersistedAuthToken } from "../../../auth/domain/services/tokenStorage";
import type { Dashboard } from "../../domain/entities/dashboard";
export type DashboardResult = { dashboard: Dashboard } | { error: Error };

const Dashboard_API_URL = "https://official-joke-api.appspot.com/random_joke";

export async function fetchDashboardFromApi(): Promise<DashboardResult> {
  try {
    const token = getPersistedAuthToken();
    const response = await fetch(Dashboard_API_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      return { error: new Error(`Failed to fetch joke: ${response.status}`) };
    }

    const dashboard = (await response.json()) as Dashboard;
    return { dashboard };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "http://localhost:8080/query";

const DASHBOARD_GRAPHQL_QUERY = /* GraphQL */ `
  query DashboardData($year: Int!, $wilaya: String!, $commune: String) {
    tpSummary(year: $year, wilaya: $wilaya, commune: $commune) {
      totalGenere
      totalSolde
    }
    tpByMonth(year: $year, wilaya: $wilaya, commune: $commune) {
      month
      tpGenere
      tpSolde
    }
    insuredUsers(wilaya: $wilaya, commune: $commune) {
      nom
      prenom
      nomPere
      nomMere
      tpSolde
      tpGenere
      nPension
      dateNaissance
      dateDeces
      typeTP
      commune
    }
  }
`;

const FILTER_OPTIONS_GRAPHQL_QUERY = /* GraphQL */ `
  query DashboardFilterOptions {
    filterOptions {
      years
      communes
      tpTypes
    }
  }
`;

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message?: string }[];
};

export type DashboardGraphQLData = {
  tpSummary: { totalGenere: number; totalSolde: number };
  tpByMonth: { month: string; tpGenere: number; tpSolde: number }[];
  insuredUsers: {
    nom: string;
    prenom: string;
    nomPere?: string | null;
    nomMere?: string | null;
    tpSolde?: number | null;
    tpGenere?: number | null;
    nPension?: string | null;
    dateNaissance?: string | null;
    dateDeces?: string | null;
    typeTP?: string | null;
    commune?: string | null;
  }[];
};

type FilterOptionsGraphQLData = {
  filterOptions: {
    years: number[];
    communes: string[];
    tpTypes: string[];
  };
};

type DashboardFetchParams = {
  year: number;
  wilaya: string;
  commune?: string | null;
};

export async function fetchDashboardData({
  year,
  wilaya,
  commune = null,
}: DashboardFetchParams): Promise<DashboardGraphQLData> {
  const token = getPersistedAuthToken();
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: DASHBOARD_GRAPHQL_QUERY,
      variables: { year, wilaya, commune },
    }),
  });

  const payload = (await response.json()) as GraphQLResponse<DashboardGraphQLData>;
  if (!response.ok) {
    throw new Error(
      `GraphQL request failed with status ${response.status}: ${response.statusText}`
    );
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }

  if (!payload.data) {
    throw new Error("Réponse GraphQL vide");
  }

  return payload.data;
}

export async function fetchFilterOptions(): Promise<FilterOptionsGraphQLData["filterOptions"]> {
  const token = getPersistedAuthToken();
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: FILTER_OPTIONS_GRAPHQL_QUERY,
    }),
  });

  const payload = (await response.json()) as GraphQLResponse<FilterOptionsGraphQLData>;
  if (!response.ok) {
    throw new Error(
      `GraphQL request failed with status ${response.status}: ${response.statusText}`
    );
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }

  if (!payload.data?.filterOptions) {
    throw new Error("Réponse GraphQL vide");
  }

  return payload.data.filterOptions;
}
