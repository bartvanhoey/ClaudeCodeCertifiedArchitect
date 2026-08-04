# my-python-stop-reason

Minimal async Python example that calls the Anthropic Claude API using the `anthropic` SDK.

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

`main.py` sends a single "Hello, Claude" message to the `claude-haiku-4-5-20251001` model using an `AsyncAnthropic` client backed by `aiohttp`, then prints the response content.

```python
async with AsyncAnthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    http_client=DefaultAioHttpClient(),
) as client:
    message = await client.messages.create(
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello, Claude"}],
        model=model,
    )
    print(message.content)
```

## Dependencies

- [`anthropic`](https://pypi.org/project/anthropic/) (with `aiohttp` extra) — Anthropic Python SDK
- `python-dotenv` — loads `ANTHROPIC_API_KEY` from `.env`
- `requests`
