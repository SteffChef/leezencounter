import { Leezenbox } from "@/types";

export async function getLeezenboxs(): Promise<Leezenbox[]> {
  try {
    // Use absolute URL with the appropriate base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    const response = await fetch(`${baseUrl}/api/leezenbox`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Make sure it's treated as a server-side request in Next.js
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
