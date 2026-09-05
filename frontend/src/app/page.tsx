"use client";

import Link from "next/link";
import {
  usePrivy,
  useWallets,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = getEmbeddedConnectedWallet(wallets);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-6 px-6 py-32">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Preflight
        </h1>

        {!ready && <p className="text-zinc-500">Loading...</p>}

        {ready && !authenticated && (
          <button
            onClick={login}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Log in with email
          </button>
        )}

        {ready && authenticated && (
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Signed in as {user?.email?.address}
            </p>
            {embeddedWallet && (
              <p className="break-all text-sm text-zinc-500">
                Embedded wallet: {embeddedWallet.address}
              </p>
            )}
            <Link
              href="/send"
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Send ETH
            </Link>
            <button
              onClick={logout}
              className="text-sm text-zinc-500 underline"
            >
              Log out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
