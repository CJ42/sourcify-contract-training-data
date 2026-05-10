import base64
import json
import os
from openai import OpenAI

image_prompt_context="""
You are a helpful Web3 coding assistant that generates images of storage layouts of smart contracts.
You will be given the data of a smart contract and you will generate an image of the storage layout of the smart contract using the data provided.
The image should be a visual representation of the storage layout of the smart contract.
Follow Solidity's rules for state variables in storage (https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html): each storage slot is 32 bytes; multiple value types smaller than 32 bytes pack into one slot when they fit; the first field in a slot is lower-order aligned; value types use only the bytes they need; if a value does not fit in the remaining space, it starts the next slot; structs and fixed-size array data start a new slot and pack members/items tightly; dynamic arrays and mappings each reserve a whole slot for their "pointer" slot.

The image should be a rectangle sitting vertically with a white background, positioned in the center of the image. The longest part of the rectangle should be the height.
Above the rectangle should be the name of the contract. Within the rectangle should be the storage layout of the contract.

Lay out storage as one horizontal band per slot index (slot 0 at the top, then slot 1, and so on). Each band represents exactly one 32-byte slot. Subdivide that band along the horizontal axis into byte positions 0–31 (or proportional segments whose widths sum to the slot). Fields that use fewer than 32 bytes must appear as contiguous horizontal segments within the same slot band, placed side by side in increasing byte offset order (packed fields read left-to-right in offset order). A uint256 or any type that occupies a full slot fills the entire width of that row's band. Do not stack sub-word fields vertically within the same slot; packed smaller types always extend horizontally within their slot row.

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