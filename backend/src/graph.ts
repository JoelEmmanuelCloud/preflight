export interface SpenderRisk {
  spender: string;
  totalApprovals: number;
  unlimitedApprovals: number;
  distinctWallets: number;
}

const QUERY = `
  query SpenderRisk($spender: Bytes!) {
    approvals(where: { spender: $spender }) {
      unlimited
      owner {
        id
      }
    }
  }
`;

export async function querySpenderRisk(spender: string): Promise<SpenderRisk> {
  const subgraphUrl = process.env.SUBGRAPH_URL;
  if (!subgraphUrl) {
    throw new Error("SUBGRAPH_URL is not configured");
  }

  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { spender: spender.toLowerCase() } }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph query failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: { approvals: { unlimited: boolean; owner: { id: string } }[] };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  const approvals = json.data?.approvals ?? [];
  const distinctWallets = new Set(approvals.map((a) => a.owner.id)).size;
  const unlimitedApprovals = approvals.filter((a) => a.unlimited).length;

  return {
    spender: spender.toLowerCase(),
    totalApprovals: approvals.length,
    unlimitedApprovals,
    distinctWallets,
  };
}
