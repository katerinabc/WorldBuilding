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
import sys
from pathlib import Path
import requests

# Find the root directory (WorldBuilding)
root_dir = Path(__file__).resolve().parents[3]  # Go up 3 levels from knowledge.domain.py
env_path = os.path.join(root_dir, '.env')

# Load environment variables from the correct path
load_dotenv(dotenv_path=env_path)

# Debug: Print paths to verify
# print("Script location:", __file__)
# print("Root directory:", root_dir)
# print("Env file path:", env_path)
# print("Env file exists:", os.path.exists(env_path))


# Default gaia-node to create the chunking. Change to your own node
# # Verify OpenAI API key is set
# if not os.getenv("OPENAI_API_KEY"):
#     raise ValueError("OPENAI_API_KEY not found in environment variables")

# Load environment variables
load_dotenv()

# Verify OpenAI API key is set
# can I use a different model for this? I'm over the limit
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

# clean text by removing everything after the Gutenberg footer
def clean_gutenberg_text(text):
    end_pattern = "*** END OF THE PROJECT GUTENBERG EBOOK"
    start_pattern = "*** START OF THE PROJECT GUTENBERG EBOOK"
    license_start_pattern = "Special rules, set forth"
    license_end_pattern = "*** END: FULL LICENSE ***"

    if isinstance(text, str):
        split_text = text.split(end_pattern)
        return split_text[0] if len(split_text) > 0 else text
    
    if isinstance(text, str):
        split_text = text.split(start_pattern)
        return split_text[0] if len(split_text) > 0 else text
    
    if isinstance(text, str):
        if license_start_pattern in text and license_end_pattern in text:
            start_idx = text.find(license_start_pattern)
            end_idx = text.find(license_end_pattern) + len(license_end_pattern)
            text = text[:start_idx] + text[end_idx:]
    return text

def save_individual_chunks(nodes: List, base_filename: str):
    """
    Save each node/chunk as a separate file in the chunks directory
    """
    # Create chunks directory if it doesn't exist
    chunks_dir = os.path.join(root_dir, "chunks", base_filename)
    os.makedirs(chunks_dir, exist_ok=True)
    
    print(f"Saving {len(nodes)} individual chunks to {chunks_dir}")
    for i, node in enumerate(nodes):
        chunk_filename = f"chunk_{i:04d}.txt"  # Pad with zeros for better sorting
        chunk_path = os.path.join(chunks_dir, chunk_filename)
        
        with open(chunk_path, 'w', encoding='utf-8') as f:
            f.write(node.get_content())
    
    print(f"Saved {len(nodes)} individual chunks in {chunks_dir}")

def load_and_process_data():
    """
    Load data from HuggingFace and convert to LlamaIndex documents
    """
    # Load the dataset from HuggingFace
    print("Loading dataset from HuggingFace...")
    df = pd.read_csv("hf://datasets/stevez80/Sci-Fi-Books-gutenberg/sci-fi-books.csv")

    lenoriginal = len(df)
    print(f"Original dataset has {lenoriginal} documents")

    print("Cleaning Gutenberg footer....")
    df['text'] = df['text'].apply(clean_gutenberg_text)
    
    print("Subsetting documents...") 
    # comment this out if you want all the documents
    # calculate length of text entries
    df['length'] = df['text'].astype(str).map(len)

    #  calculate  avg and standard deviation to get min and max for filtering documents
    avg = df['length'].median()
    stdev = df['length'].std()
    print(f" the  avg length is { avg} and the stdev is {stdev}. min value = { avg - stdev}, max value = {avg + stdev}. ")
    
    # getting subset of documents
    # experiment with the best subset size. Ideally take everything around the average (+/- 1 stedv)
    # on a larger machine, you can take all the documents. 
    print("Creating the subset of documents...")
    df = df[df['length'] <  avg]
    print(f"subset as {len(df)} documents out of {lenoriginal}. ")

    # Convert DataFrame rows to Documents starting with shortest text
    print("Converting DataFrame to Documents...")
    # Sort by length (shortest first). begin embedding with the shortest
    df = df[df['length'] < avg].sort_values('length')
    
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

    embed_model = OpenAIEmbedding(
        api_base=os.getenv("GAIANET_SERVER_URL"),
        api_key=os.getenv("GAIA_API_KEY"),
        model_name="llama",
        embed_batch_size=8,
        max_retries=3,
        timeout=30,
        show_progress=True
    )
    splitter = SemanticSplitterNodeParser(
        buffer_size=1, 
        breakpoint_percentile_threshold=95, 
        embed_model=embed_model,
        chunk_size=512,
        chunk_overlap=50
    )
    
    # # Skip first 200 documents
    # df = df.iloc[200:]
    # print(f"After skipping 200 docs, dataset has {len(df)} documents")

    # Process documents into nodes
    print("Splitting documents into chunks...")
    all_nodes = []  # Collect all nodes
    total_docs = len(documents)
    for i, doc in enumerate(documents):
        try:
            print(f"Processing document {i+1}/{total_docs}, size: {len(doc.text)} characters")
            nodes = splitter.get_nodes_from_documents([doc])
            all_nodes.extend(nodes)  # Add nodes to collection

            # Save individual chunks for this document in a subdirectory
            doc_dirname = f"document_{i:04d}"  # Pad with zeros for better sorting
            save_individual_chunks(nodes, doc_dirname)

        except Exception as e:
            print(f"Error processing document {i}: {str(e)}")
            continue

    # Save all nodes to a single file
    print(f"\nSaving all {len(all_nodes)} nodes to final file...")
    save_nodes_to_file(all_nodes, "all_sci_fi_chunks.txt")
    print("Final file saved as: all_sci_fi_chunks.txt")

    return "Processing complete"

# Validate Gaia endpoint
def validate_gaia_endpoint():
    gaia_url = os.getenv("GAIANET_SERVER_URL")
    api_key = os.getenv("GAIA_API_KEY")
    
    print(f"Checking Gaia endpoint: {gaia_url}")
    
    try:
        # Try to access the models endpoint (a common OpenAI-compatible endpoint)
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        response = requests.get(f"{gaia_url}/models", headers=headers)
        
        if response.status_code == 200:
            print("✅ Gaia endpoint is accessible")
            print("Available models:", response.json())
            return True
        else:
            print(f"❌ Gaia endpoint returned status code: {response.status_code}")
            print("Response:", response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to Gaia endpoint: {str(e)}")
        return False

# Validate before proceeding
if not validate_gaia_endpoint():
    print("Exiting due to inaccessible Gaia endpoint")
    sys.exit(1)

if __name__ == "__main__":
    print(f"gaia server url: {os.getenv('GAIANET_SERVER_URL')}")
    # validate_gaia_endpoint()
    nodes = load_and_process_data()
    print(f"Successfully processed {len(nodes)} nodes")
    # return nodes