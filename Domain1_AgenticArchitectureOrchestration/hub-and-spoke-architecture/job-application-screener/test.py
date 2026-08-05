import anthropic
import json
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()

# Simple test
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,
    messages=[
        {
            "role": "user",
            "content": "Say 'API working' in JSON format"
        }
    ]
)

print(response.content[0].text)
