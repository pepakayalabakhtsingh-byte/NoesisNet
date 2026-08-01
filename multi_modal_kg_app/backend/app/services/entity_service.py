import spacy
from spacy.pipeline import EntityRuler
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class EntityExtractor:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EntityExtractor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        logger.info("Initializing spaCy NLP model (en_core_web_lg)...")
        try:
            self.nlp = spacy.load("en_core_web_lg")
        except OSError:
            logger.warning("en_core_web_lg not found! Falling back to sm or empty model for safety.")
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                self.nlp = spacy.blank("en")
        
        # Add custom entity ruler
        patterns_file = Path(__file__).parent.parent / "data" / "entity_patterns.jsonl"
        
        # The ruler goes before 'ner' so our custom patterns take precedence
        if "ner" in self.nlp.pipe_names:
            ruler = self.nlp.add_pipe("entity_ruler", before="ner")
        else:
            ruler = self.nlp.add_pipe("entity_ruler")
            
        if patterns_file.exists():
            ruler.from_disk(patterns_file)
            logger.info(f"Loaded {patterns_file.name} patterns into EntityRuler.")
        else:
            logger.warning(f"Pattern file {patterns_file} not found.")
            
        self._initialized = True

    def extract_entities(self, doc) -> list[dict]:
        """
        Extract unique named entities from the processed spacy Doc.
        """
        entities = []
        seen = set()
        for ent in doc.ents:
            key = (ent.text.lower(), ent.label_)
            if key not in seen:
                seen.add(key)
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char
                })
        return entities

    def extract_relations(self, doc) -> list[dict]:
        """
        Extract subject -> verb -> object relations using dependency parsing.
        """
        relations = []
        
        # Set of interesting verbs related to compliance / rules
        target_verbs = {"applies", "comply", "includes", "defines", "must", "shall", "requires", "protects", "penalizes"}
        
        # A quick lookup for entity texts to mark subject/object as entity
        entity_texts = {ent.text.lower() for ent in doc.ents}

        for token in doc:
            # We look for main verbs (ROOT or general verbs)
            if token.pos_ == "VERB" or token.lemma_ in target_verbs:
                subj = None
                obj = None
                
                # Find subject and object children
                for child in token.children:
                    if child.dep_ in ("nsubj", "nsubjpass", "csubj"):
                        # Get the full noun chunk for the subject
                        subj = self._get_chunk(child, doc)
                    elif child.dep_ in ("dobj", "pobj", "attr", "prep"):
                        # If it's a preposition, look for its object
                        if child.dep_ == "prep":
                            for grandchild in child.children:
                                if grandchild.dep_ == "pobj":
                                    obj = self._get_chunk(grandchild, doc)
                                    break
                        else:
                            obj = self._get_chunk(child, doc)
                            
                if subj and obj:
                    relations.append({
                        "subject": subj,
                        "relation": token.lemma_,
                        "object": obj,
                        "subject_entity": subj.lower() in entity_texts,
                        "object_entity": obj.lower() in entity_texts
                    })
                    
        return relations

    def _get_chunk(self, token, doc):
        """Helper to get the noun chunk that contains the given token."""
        for chunk in doc.noun_chunks:
            if chunk.start <= token.i < chunk.end:
                return chunk.text
        return token.text

    def process(self, text: str) -> dict:
        if not text or not text.strip():
            return {"entities": [], "relations": []}
            
        doc = self.nlp(text)
        
        return {
            "entities": self.extract_entities(doc),
            "relations": self.extract_relations(doc)
        }
