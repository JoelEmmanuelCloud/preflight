export interface SpenderRisk {
  spender: string;
  totalApprovals: number;
  unlimitedApprovals: number;
  distinctWallets: number;
}

export async function fetchSpenderRisk(spender: `0x${string}`): Promise<SpenderRisk> {
  const apiUrl = process.env.NEXT_PUBLIC_PREFLIGHT_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_PREFLIGHT_API_URL is not configured");
  }

  const response = await fetch(`${apiUrl}/spender-risk?spender=${spender}`);
  if (!response.ok) {
    throw new Error(`spender-risk request failed with status ${response.status}`);
  }

  return (await response.json()) as SpenderRisk;
}
