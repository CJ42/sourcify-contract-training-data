import base64
import json
import os
from openai import OpenAI

image_prompt_context="""
You are a helpful Web3 coding assistant that generates images of storage layouts of smart contracts.
You will be given the data of a smart contract and you will generate an image of the storage layout of the smart contract using the data provided.
The image should be a visual representation of the storage layout of the smart contract.
The image should be a rectangle sitting vertically with a white background, positioned in the center of the image. The longest part of the rectangle should be the height.
Above the rectangle should be the name of the contract. Within the rectangle should be the storage layout of the contract.
The storage layout should be represented as a grid of cells. Each cell should be a square. There are at most 32 cells per row. Each row is a storage slot.
The image should be a high quality image with a white background.
"""

def generate_storage_layout_image(data: str) -> str:
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )
    
    prompt = f"Generate an image of the storage layout of the following smart contract using the data provided: {json.dumps(data)}"

    image = client.images.generate(
        model='gpt-image-1.5',
        prompt=prompt,
        n=1,
        size="1024x1024"
    )

    image_bytes = base64.b64decode(image.data[0].b64_json)
    with open("storage_layout_image.png", "wb") as f:
        f.write(image_bytes)