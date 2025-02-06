# Gaia Node Setup for ETHGlobal Hackathon

Remember to re-initialize and re-start the node after you make configuration changes.
FOLLOW THIS

```
# If the node is running
gaianet stop
gaianet init
gaianet start
```

Steps to create a custom Gaia node with sci-fi knowledge:

```install gaianet cli
   curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash
```

```
✨ Your node ID is 0x89587565873f81206089093b73d7634313fc3497. 🌟 Please register it in your portal account to receive rewards!

>>> Next, you should initialize the GaiaNet node with the LLM and knowledge base. To initialize the GaiaNet node, you need to
>>> * Run the command 'source /Users/katerinadoyle/.zshrc' to make the gaianet CLI tool available in the current shell;
>>> * Run the command 'gaianet init' to initialize the GaiaNet node.
```

Note: Don't use `gaianet init` as it will download kw base about paris + llama3. These are the default models.
Go to gaianet node github repo and check node-config. Pick one from there.
This will give you another gaianet init command with the picked model.

I've used: gaianet init --config https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/qwen2 5-0.5b-instruct/config.json

It's the smallest model. Test if this works.
Ideal model choice: qwen-2.5-coder-3b-instruct

Check here for more info about customizing node: https://docs.gaianet.ai/getting-started/customize

I need to create my own config file for setting up the node.

## Implementation Steps

1. Create gaia node

- base model: qwen1.5b
- default setting

2. Create knowledge domain

- training data: sci-fi literature corpus: filtered to make it manageable for the hackaton. Focused on 10% of the smallest books. If time, increase to 50%.

install wasmedge runtime

```
curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install_v2.sh | bash -s
```

download embedding model to create rag

```
curl -sSf https://huggingface.co/BAAI/bge-small-en-v1.5/resolve/main/bge.small.en.v1.5.bin -o bge.small.en.v1.5.bin
```

follow the instructions for creating a knowledge domain on the gaianet docs
url for science fiction corpus: "hf://datasets/katerinabc/gutenberg-scifi/gutenbergscifi.tar.gz"

new config file for my gaianet node

remember to stop the gaianode if it's running

gaianet init --config \
 --snapshot hf://datasets/katerinabc/gutenberg-scifi/gutenbergscifi.tar.gz \
 --embedding-url https://huggingface.co/gaianet/Nomic-embed-text-v1.5-Embedding-GGUF/resolve/main/nomic-embed-text-v1.5.f16.gguf \
 --embedding-ctx-size 8192 \
 --system-prompt "You are a science fiction writer. You know the classics but also the obscure sci-fi short stories. Your stories may contain aliens, robots or made up technology and planets. You follow the typical style of a hero facing an external, internal and philosophical callenge. The hero is being guided by a mentor." \
 --rag-prompt "The following text is the context for the user question.\n----------------\n"

gaianet init --config https://github.com/katerinabc/WorldBuilding/blob/gaiamodel/server/src/services/gaianode.config.json
