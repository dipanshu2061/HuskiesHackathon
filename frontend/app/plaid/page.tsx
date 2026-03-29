"use client";

import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function Home() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Step 1: Get link_token from your Express backend
  const getLinkToken = async () => {
    setStatus("Getting link token...");
    const user_id = localStorage.getItem("userId")
    const token = localStorage.getItem("token")
    console.log("userID is", user_id)
    const res = await fetch("http://localhost:5000/api/plaid/link/token/create", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      //TODO figure how to pass userID
      body: JSON.stringify({ userId: user_id }),
    });
    const data = await res.json();
    console.log(data)
    setLinkToken(data.link_token);
    setStatus("Ready — click 'Connect Bank'");
  };

  // Step 3: Exchange public_token via your Express backend
  const onSuccess = useCallback(async (public_token: string) => {
    setStatus("Exchanging token...");
    console.log(public_token)
    const res = await fetch("http://localhost:5000/api/plaid/item/public_token/exchange", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ public_token }),
    });
    const data = await res.json();
    setStatus(`✅ Bank linked! Item ID: ${data.item_id}`);
    //redirect
      window.location.href = "/dashboard";
  }, []);

  // Step 2: Open Plaid Link UI
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: (err) => {
      if (err) setStatus(`❌ Error: ${err.display_message || err.error_message}`);
    },
  });

  return (
  <div
        style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans',sans-serif", color: "#111110", display: "flex", flexDirection: "column" }}
    >
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Connect Your Bank</h1>

      {!linkToken ? (
        <button
          onClick={getLinkToken}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start
        </button>
      ) : (
        <button
          onClick={() => open()}
          disabled={!ready}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Connect Bank
        </button>
      )}

      {status && <p className="text-gray-600">{status}</p>}
    </div>
  </div>
  );
}
