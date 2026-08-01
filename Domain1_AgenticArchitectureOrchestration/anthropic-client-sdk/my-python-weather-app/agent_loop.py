

"""
ANTHROPIC CLIENT SDK
====================

Minimal agentic loop demo (Domain1-AgenticArchitecture.md):
Claude decides which tools to call; this script executes them and feeds
results back until Claude reaches a final answer.

Tool calls are executed locally, in this Python process — never inside
Anthropic's API. Only the reasoning step (client.messages.create) is remote.
"""

import json
import os

import requests
from anthropic import Anthropic # type: ignore
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g. 'Paris'"},
            },
            "required": ["city"],
        },
    },
    {
        "name": "book_flight",
        "description": "Book a flight to a destination city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "Destination city name"},
            },
            "required": ["destination"],
        },
    },
    {
        "name": "book_hotel",
        "description": "Book a hotel stay in a city for a number of nights.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g. 'Rome'"},
                "nights": {"type": "integer", "description": "Number of nights to stay"},
            },
            "required": ["city", "nights"],
        },
    },
]


def get_weather(city: str) -> str:
    """Real weather lookup via Open-Meteo (no API key required)."""
    geo = requests.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": city, "count": 1},
        timeout=10,
    ).json()

    results = geo.get("results")
    if not results:
        return json.dumps({"error": f"Could not find location '{city}'"})

    lat, lon = results[0]["latitude"], results[0]["longitude"]

    forecast = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={"latitude": lat, "longitude": lon, "current_weather": True},
        timeout=10,
    ).json()

    current = forecast["current_weather"]
    # Open-Meteo weathercode: 0 = clear sky, 1 = mainly clear
    is_sunny = current["weathercode"] in (0, 1)

    return json.dumps(
        {
            "city": city,
            "temperature_c": current["temperature"],
            "weathercode": current["weathercode"],
            "sunny": is_sunny,
        }
    )


def book_flight(destination: str) -> str:
    """Mocked flight booking — no real booking API is called."""
    return json.dumps(
        {
            "status": "booked",
            "destination": destination,
            "confirmation": f"MOCK-{destination.upper()[:3]}-001",
        }
    )


def book_hotel(city: str, nights: int) -> str:
    """Mocked hotel booking — no real booking API is called."""
    return json.dumps(
        {
            "status": "booked",
            "city": city,
            "nights": nights,
            "confirmation": f"HOTEL-{city.upper()[:3]}-{nights}N",
        }
    )


def execute_tool(name: str, tool_input: dict) -> str:
    if name == "get_weather":
        return get_weather(tool_input["city"])
    if name == "book_flight":
        return book_flight(tool_input["destination"])
    if name == "book_hotel":
        return book_hotel(tool_input["city"], tool_input["nights"])
    return json.dumps({"error": f"Unknown tool '{name}'"})


def run(user_message: str) -> None:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            tools=tools,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        print(f"\n[Claude]: {response.content}")

        for block in response.content:
            if block.type == "text":
                print(f"\n[Claude]: {block.text}")
            elif block.type == "tool_use":
                print(f"\n[Tool call]: {block.name}({block.input})")

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    print(f"[Tool result]: {result}")
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        }
                    )
            messages.append({"role": "user", "content": tool_results})
            continue

        if response.stop_reason == "end_turn":
            break


if __name__ == "__main__":
    # run("I have an aunt living in Boston, Lincolnshire, UK, but I am not sure in which country, and I also don't know what the weather is like there at the moment, then book a flight there if it's sunny.")
    run("Check the weather in Rome, and if it's sunny, book a flight and a hotel for 3 nights.")
    # run("I have an aunt living in Seoul, South Korea but I don't know what the weather is like there at the moment, then book a flight there if it's sunny.")
    # run("Is there a letter A in the word school, then book a flight there if it's sunny.")
    # run("What's the weather in London, then book a flight there if it's sunny.")
