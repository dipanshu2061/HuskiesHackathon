"use client"

import NavBar from "@/components/NavBar"

export default function page() {
  return (
    <div
      style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans',sans-serif", color: "#111110", display: "flex", flexDirection: "column" }}
    >
      <NavBar />
      dashboard
    </div>
  )
}

