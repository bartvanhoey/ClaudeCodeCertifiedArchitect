# my-decision-making-app

Minimal async Python example of a tool-using agent with the Anthropic Claude API using the `anthropic` SDK.

## Prerequisites

- Python 3.9+
- An Anthropic API key

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the project root with your API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

```bash
python main.py
```

## Dependencies

- [`anthropic`](https://pypi.org/project/anthropic/) (with `aiohttp` extra) — Anthropic Python SDK
- `python-dotenv` — loads `ANTHROPIC_API_KEY` from `.env`
- `requests`
