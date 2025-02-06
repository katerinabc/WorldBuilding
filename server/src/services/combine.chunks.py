import os
import glob

def combine_chunks():
    # Get all chunk files
    chunk_files = glob.glob('chunks_*.txt')
    print(f"Found {len(chunk_files)} chunk files")
    
    # Sort them numerically
    chunk_files.sort(key=lambda x: int(x.split('_')[1].split('.')[0]))
    
    # Combine into one file
    with open('combined_chunks.txt', 'w', encoding='utf-8') as outfile:
        for chunk_file in chunk_files:
            print(f"Processing {chunk_file}")
            try:
                with open(chunk_file, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    # Remove Gutenberg footer if present
                    if "*** END OF THE PROJECT GUTENBERG EBOOK" in content:
                        content = content.split("*** END OF THE PROJECT GUTENBERG EBOOK")[0]
                    # Remove Gutenberg header if present
                    if "*** START OF THE PROJECT GUTENBERG EBOOK" in content:
                        parts = content.split("*** START OF THE PROJECT GUTENBERG EBOOK")
                        if len(parts) > 1:
                            try:
                                # Take everything after the START pattern
                                content = parts[1].split('\n', 1)[1]  # Split on first newline
                            except IndexError:
                                print(f"Warning: Could not process header in {chunk_file}")
                                content = parts[1]  # Just use everything after START if split fails
                    # Remove license section if present
                    if "Special rules, set forth" in content and "*** END: FULL LICENSE ***" in content:
                        start_idx = content.find("Special rules, set forth")
                        end_idx = content.find("*** END: FULL LICENSE ***") + len("*** END: FULL LICENSE ***")
                        content = content[:start_idx] + content[end_idx:]

                    outfile.write(content + "\n\n")
            except Exception as e:
                print(f"Error processing {chunk_file}: {str(e)}")
                continue
    
    # Delete chunk files
    print("Deleting chunk files...")
    for chunk_file in chunk_files:
        try:
            os.remove(chunk_file)
            print(f"Deleted {chunk_file}")
        except Exception as e:
            print(f"Error deleting {chunk_file}: {str(e)}")
    
    print("Done! Combined file saved as 'combined_chunks.txt'")

if __name__ == "__main__":
    combine_chunks()