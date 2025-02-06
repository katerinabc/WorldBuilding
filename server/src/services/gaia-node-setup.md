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

1. Model Selection & Training

   - Base Model: Llama2 7B (quantized)
   - Training Data: Sci-fi literature corpus
   - Fine-tuning parameters

2. Node Configuration

   - Hardware requirements
   - Environment setup
   - Model deployment

3. Gaia Integration

   - Node registration
   - API endpoint setup
   - Authentication

4. Knowledge Base

   - Sci-fi corpus integration
   - Vector embeddings
   - Retrieval system

5. Testing & Validation
   - Response quality
   - Performance metrics
   - Integration tests
