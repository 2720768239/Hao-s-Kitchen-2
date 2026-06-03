"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChefLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="mobile-canvas chef-console">
      <section className="chef-card login-card">
        <h1>主厨工具台</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            const response = await fetch("/api/chef/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });

            if (response.ok) {
              router.push("/chef");
              router.refresh();
            } else {
              setError("口令不对");
            }
          }}
        >
          <label>
            主厨口令
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="chef-primary" type="submit">
            进入主厨工具台
          </button>
        </form>
      </section>
    </main>
  );
}
