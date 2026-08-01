def chunk_text(text: str, max_chunk_size=400, overlap=50) -> list[str]:
    """
    Naively chunks text by words. Max chunk size of 400 words loosely 
    approximates the 512 token limit of standard sentence-transformers models.
    """
    if not text:
        return []
        
    words = text.split()
    chunks = []
    
    if len(words) == 0:
        return []
        
    i = 0
    while i < len(words):
        chunk_words = words[i:i + max_chunk_size]
        chunks.append(" ".join(chunk_words))
        i += max_chunk_size - overlap
        
    return chunks
