# this file sets up the knowledge domain for the gaia node. 
# it only needs to run once to fine-tune the model.

# Explainer chunking of text
# https://docs.llamaindex.ai/en/stable/examples/node_parsers/semantic_chunking/

# make sure you are logged in with hugging face with the cli. 

import os
import pandas as pd
from datasets import load_dataset
from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding
#pip install llama-index-readers-huggingface-fs
# from llama_index.readers.huggingface_fs import HuggingFaceFSReader
#pip install python-dotenv
from dotenv import load_dotenv
from typing import List

# Load environment variables
load_dotenv()

# Verify OpenAI API key is set
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY not found in environment variables")

def save_nodes_to_file(nodes: List, output_file: str = "sci_fi_chunks.txt"):
    """
    Save nodes to a text file with empty lines between chunks
    as required by Gaia's paragraph_embed tool
    """
    print(f"Saving {len(nodes)} chunks to {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        for node in nodes:
            # Write the chunk content
            f.write(node.get_content())
            # Add two newlines to create an empty line between chunks
            f.write('\n\n')
    print(f"Saved chunks to {output_file}")

def load_and_process_data():
    """
    Load data from HuggingFace and convert to LlamaIndex documents
    """
    # Load the dataset from HuggingFace
    print("Loading dataset from HuggingFace...")
    df = pd.read_csv("hf://datasets/stevez80/Sci-Fi-Books-gutenberg/sci-fi-books.csv")
    
    # Convert DataFrame rows to Documents
    print("Converting DataFrame to Documents...")
    documents = []
    for idx, row in df.iterrows():
        doc = Document(
            text=str(row['text']),
            metadata={
                'source': f"document_{idx}",
            }
        )
        documents.append(doc)
    
    print(f"Created {len(documents)} documents")
    
    # Initialize the semantic splitter
    print(f"Initializing semantic splitter...")
    embed_model = OpenAIEmbedding()
    splitter = SemanticSplitterNodeParser(
        buffer_size=1, 
        breakpoint_percentile_threshold=95, 
        embed_model=embed_model
    )
    
    # Process documents into nodes
    print("Splitting documents into chunks...")
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"Created {len(nodes)} nodes")
    
    # Save nodes in Gaia-compatible format
    save_nodes_to_file(nodes)
    
    return nodes

if __name__ == "__main__":
    nodes = load_and_process_data()
    print(f"Successfully processed {len(nodes)} nodes")

    

# # get documents
# df = pd.read_csv("hf://datasets/stevez80/Sci-Fi-Books-gutenberg/sci-fi-books.csv")

# # load documents
# documents = SimpleDirectoryReader(input_files=["pg_essay.txt"]).load_data()

# embed_model = OpenAIEmbedding()
# splitter = SemanticSplitterNodeParser(
#     buffer_size=1, breakpoint_percentile_threshold=95, embed_model=embed_model
# )

# # also baseline splitter
# base_splitter = SentenceSplitter(chunk_size=512)

# nodes = splitter.get_nodes_from_documents(documents)

# # inspect a chunk
# print(nodes[1].get_content())


