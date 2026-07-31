import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// This is the Claude Agent SDK port of ../my-python-weather-app/agent_loop.py.
// Same 3 tools, same scenarios — but the agentic loop, tool execution, and
// message bookkeeping that agent_loop.py hand-writes are all handled by query().

const weatherTool = tool(
  "get_weather",
  "Get the current weather for a city.",
  { city: z.string().describe("City name, e.g. 'Paris'") },
  async ({ city }) => {
    const geo = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    ).then((r) => r.json())) as { results?: Array<{ latitude: number; longitude: number }> };

    const result = geo.results?.[0];
    if (!result) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Could not find location '${city}'` }) }],
      };
    }

    const { latitude, longitude } = result;
    const forecast = (await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    ).then((r) => r.json())) as { current_weather: { temperature: number; weathercode: number } };

    const current = forecast.current_weather;
    // Open-Meteo weathercode: 0 = clear sky, 1 = mainly clear
    const sunny = current.weathercode === 0 || current.weathercode === 1;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            city,
            temperature_c: current.temperature,
            weathercode: current.weathercode,
            sunny,
          }),
        },
      ],
    };
  }
);

const bookFlightTool = tool(
  "book_flight",
  "Book a flight to a destination city.",
  { destination: z.string().describe("Destination city name") },
  async ({ destination }) => {
    // Mocked flight booking — no real booking API is called.
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "booked",
            destination,
            confirmation: `MOCK-${destination.toUpperCase().slice(0, 3)}-001`,
          }),
        },
      ],
    };
  }
);

const bookHotelTool = tool(
  "book_hotel",
  "Book a hotel stay in a city for a number of nights.",
  {
    city: z.string().describe("City name, e.g. 'Rome'"),
    nights: z.number().int().describe("Number of nights to stay"),
  },
  async ({ city, nights }) => {
    // Mocked hotel booking — no real booking API is called.
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "booked",
            city,
            nights,
            confirmation: `HOTEL-${city.toUpperCase().slice(0, 3)}-${nights}N`,
          }),
        },
      ],
    };
  }
);

const travelServer = createSdkMcpServer({
  name: "travel-tools",
  tools: [weatherTool, bookFlightTool, bookHotelTool],
});

async function run(prompt: string): Promise<void> {
  for await (const message of query({
    prompt,
    options: {
      mcpServers: { "travel-tools": travelServer },
      allowedTools: [
        "mcp__travel-tools__get_weather",
        "mcp__travel-tools__book_flight",
        "mcp__travel-tools__book_hotel",
      ],
    },
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if (block.type === "text") {
          console.log(`\n[Claude]: ${block.text}`);
        } else if ("name" in block) {
          console.log(`\n[Tool call]: ${block.name}(${JSON.stringify(block.input)})`);
        }
      }
    } else if (message.type === "result") {
      console.log(`\nDone: ${message.subtype}`);
    }
  }
}

// run("I have an aunt living in Boston, Lincolnshire, UK, but I am not sure in which country, and I also don't know what the weather is like there at the moment, then book a flight there if it's sunny.");
await run("Check the weather in Rome, and if it's sunny, book a flight and a hotel for 3 nights.");
// run("I have an aunt living in Seoul, South Korea but I don't know what the weather is like there at the moment, then book a flight there if it's sunny.");
// run("Is there a letter A in the word school, then book a flight there if it's sunny.");
// run("What's the weather in London, then book a flight there if it's sunny.");
