import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { TraceLog } from "./trace-log";

const client = new Anthropic();

const tools: Tool[] = [
  {
    name: "get_weather",
    description:
      "Get the current weather for a city, including temperature (°C), whether it's sunny, and whether it's raining.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. 'Paris'" },
      },
      required: ["city"],
    },
  },
  {
    name: "book_flight",
    description: "Book a flight to a destination city.",
    input_schema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Destination city name" },
      },
      required: ["destination"],
    },
  },
  {
    name: "book_hotel",
    description: "Book a hotel stay in a city for a number of nights.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. 'Rome'" },
        nights: { type: "integer", description: "Number of nights to stay" },
      },
      required: ["city", "nights"],
    },
  },
];

async function getWeather(city: string): Promise<string> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
  );
  const geo = await geoRes.json();
  const result = geo.results?.[0];
  if (!result) {
    return JSON.stringify({ error: `Could not find location '${city}'` });
  }

  const { latitude, longitude } = result;
  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
  );
  const forecast = await forecastRes.json();
  const current = forecast.current_weather;
  const isSunny = current.weathercode === 0 || current.weathercode === 1;
  const isRaining = current.weathercode >= 51;

  return JSON.stringify({
    city,
    temperature_c: current.temperature,
    weathercode: current.weathercode,
    sunny: isSunny,
    raining: isRaining,
  });
}

function bookFlight(destination: string): string {
  return JSON.stringify({
    status: "booked",
    destination,
    confirmation: `MOCK-${destination.toUpperCase().slice(0, 3)}-001`,
  });
}

function bookHotel(city: string, nights: number): string {
  return JSON.stringify({
    status: "booked",
    city,
    nights,
    confirmation: `HOTEL-${city.toUpperCase().slice(0, 3)}-${nights}N`,
  });
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  if (name === "get_weather") return getWeather(input.city as string);
  if (name === "book_flight") return bookFlight(input.destination as string);
  if (name === "book_hotel")
    return bookHotel(input.city as string, input.nights as number);
  return JSON.stringify({ error: `Unknown tool '${name}'` });
}

export async function POST(request: Request) {
  const body = await request.json();
  console.log("Request body:", body);
  const { instruction } = body;
  if (!instruction || typeof instruction !== "string") {
    return Response.json(
      { error: "Missing 'instruction' in request body" },
      { status: 400 },
    );
  }

  const messages: MessageParam[] = [
    {
      role: "user",
      content: instruction,
    },
  ];

  console.log("Initial messages:", messages);

  const trace = new TraceLog();

  while (true) {
    // Call the Anthropic API with the current messages and tools to get a response
    // The model will decide whether to respond with Text or to call a Tool
    // based on the instruction and the conversation context
    const anthropicMessage = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You help with travel bookings. Always check the weather for a destination before booking anything conditional on it. Use any booking details the user specifies (such as number of nights) exactly as given. If a detail isn't specified, pick a reasonable default and proceed rather than asking a follow-up question.",
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: anthropicMessage.content });

    trace.recordContentBlocks(anthropicMessage.content);

    if (anthropicMessage.stop_reason === "tool_use") {
      const toolResults: ToolResultBlockParam[] = [];
      for (const contentBlock of anthropicMessage.content) {
        if (contentBlock.type === "tool_use") {
          const result = await executeTool(
            contentBlock.name,
            contentBlock.input as Record<string, unknown>,
          );
          trace.addToolResult(result);
          toolResults.push({
            type: "tool_result",
            tool_use_id: contentBlock.id,
            content: result,
          });
        } 
      }
      messages.push({ role: "user", content: toolResults });
      continue; // Continue the loop to get the next response after tool execution
    } else if (anthropicMessage.stop_reason === "pause_turn") {
      trace.addPauseTurn();
      continue; // Continue the loop to let the model finish its paused turn
    } else if (anthropicMessage.stop_reason === "max_tokens") {
      trace.addMaxTokens();
    } else if (anthropicMessage.stop_reason === "stop_sequence") {
      trace.addStopSequence();
    } else if (anthropicMessage.stop_reason === "end_turn") {
      trace.addEndTurn();
    } else if (anthropicMessage.stop_reason === "refusal") {
      trace.addRefusal();
    }
    break;
  }

  return Response.json({ traceLog: trace.toArray() });
}
