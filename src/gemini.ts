export type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export async function initChat(): Promise<string> {
  return "Welcome to our Elite Property Advisory. Are you looking to buy, invest, or rent?";
}

export async function sendMessage(message: string, history: ChatMessage[] = [], apiKey?: string): Promise<string> {
  const messages = [...history, { role: "user", text: message }];
  
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-groq-api-key"] = apiKey;
  }
  
  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  
  const data = await response.json();
  return data.text;
}
