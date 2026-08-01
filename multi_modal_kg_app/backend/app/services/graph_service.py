import logging
from neo4j import GraphDatabase
from app.config import settings
from app.database import get_db
from bson import ObjectId
import asyncio

logger = logging.getLogger(__name__)

class GraphBuilder:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphBuilder, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        if self._initialized: return
        self.uri = settings.neo4j_uri
        self.user = settings.neo4j_user
        self.password = settings.neo4j_password
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
        self._initialized = True
        self.create_constraints()
        
    def close(self):
        if self.driver:
            self.driver.close()
            
    def create_constraints(self):
        try:
            with self.driver.session() as session:
                session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE")
                session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Document) REQUIRE d.doc_id IS UNIQUE")
        except Exception as e:
            logger.warning(f"Could not create Neo4j constraints (make sure Neo4j is running): {e}")
                
    async def build_for_document(self, doc_id: str):
        db = get_db()
        doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            raise ValueError(f"Document {doc_id} not found in MongoDB.")
            
        return await asyncio.to_thread(self._build_for_document_sync, doc)
        
    async def build_all(self):
        db = get_db()
        cursor = db.documents.find({"status": "completed"})
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
        for doc in docs:
            try:
                await asyncio.to_thread(self._build_for_document_sync, doc)
            except Exception as e:
                logger.error(f"Failed to build graph for doc {doc.get('_id')}: {e}")
        
    def _build_for_document_sync(self, doc):
        doc_id = str(doc["_id"])
        filename = doc.get("filename", "Unknown")
        category = doc.get("category", "unknown")
        
        entities = doc.get("entities", [])
        relations = doc.get("relations", [])
        
        if not entities and not relations:
            return
            
        try:
            with self.driver.session() as session:
                session.execute_write(self._merge_graph_tx, doc_id, filename, category, entities, relations)
        except Exception as e:
            logger.error(f"Neo4j Transaction failed for {doc_id}: {e}")
            
    @staticmethod
    def _merge_graph_tx(tx, doc_id, filename, category, entities, relations):
        # Merge Document Node
        tx.run(
            """
            MERGE (d:Document {doc_id: $doc_id})
            ON CREATE SET d.filename = $filename, d.category = $category
            ON MATCH SET d.filename = $filename, d.category = $category
            """,
            doc_id=doc_id, filename=filename, category=category
        )
        
        # Merge Entities and Link to Document
        for ent in entities:
            ent_name = ent.get("text")
            ent_cat = ent.get("label", "UNKNOWN")
            if not ent_name: continue
            
            # Using Name_Category as a unique ID to allow identically named entities of different types (e.g. Apple (ORG) vs Apple (FRUIT))
            ent_id = f"{ent_name}_{ent_cat}"
            
            tx.run(
                """
                MERGE (e:Entity {id: $ent_id})
                ON CREATE SET e.name = $ent_name, e.category = $ent_cat, e.source_document_ids = [$doc_id]
                ON MATCH SET e.source_document_ids = 
                    CASE 
                        WHEN $doc_id IN coalesce(e.source_document_ids, []) THEN coalesce(e.source_document_ids, [])
                        ELSE coalesce(e.source_document_ids, []) + [$doc_id]
                    END
                MERGE (d:Document {doc_id: $doc_id})
                MERGE (d)-[:CONTAINS]->(e)
                """,
                ent_id=ent_id, ent_name=ent_name, ent_cat=ent_cat, doc_id=doc_id
            )
            
        entity_cat_map = {e.get("text", "").lower(): e.get("label", "UNKNOWN") for e in entities if e.get("text")}
        
        # Merge Relations
        for rel in relations:
            subj = rel.get("subject")
            obj = rel.get("object")
            rel_type = rel.get("relation")
            
            if not subj or not obj or not rel_type: continue
            
            subj_cat = entity_cat_map.get(subj.lower(), "UNKNOWN")
            obj_cat = entity_cat_map.get(obj.lower(), "UNKNOWN")
            
            subj_id = f"{subj}_{subj_cat}"
            obj_id = f"{obj}_{obj_cat}"
            
            tx.run(
                """
                MERGE (s:Entity {id: $subj_id})
                ON CREATE SET s.name = $subj, s.category = $subj_cat
                
                MERGE (o:Entity {id: $obj_id})
                ON CREATE SET o.name = $obj, o.category = $obj_cat
                
                MERGE (s)-[r:RELATES_TO {relation_type: $rel_type}]->(o)
                ON CREATE SET r.doc_id = $doc_id
                """,
                subj_id=subj_id, subj=subj, subj_cat=subj_cat,
                obj_id=obj_id, obj=obj, obj_cat=obj_cat,
                rel_type=rel_type, doc_id=doc_id
            )
            
    async def get_graph_data(self, limit=200):
        return await asyncio.to_thread(self._get_graph_data_sync, limit)

    def _get_graph_data_sync(self, limit):
        try:
            with self.driver.session() as session:
                result = session.run(
                    """
                    MATCH (n:Entity)-[r:RELATES_TO]->(m:Entity)
                    RETURN n, r, m
                    LIMIT $limit
                    """,
                    limit=limit
                )
                nodes = {}
                links = []
                
                for record in result:
                    n = record["n"]
                    m = record["m"]
                    r = record["r"]
                    
                    nodes[n["id"]] = {"id": n["id"], "name": n["name"], "category": n["category"]}
                    nodes[m["id"]] = {"id": m["id"], "name": m["name"], "category": m["category"]}
                    
                    links.append({
                        "source": n["id"],
                        "target": m["id"],
                        "relation": r["relation_type"]
                    })
                    
                if len(nodes) < limit:
                    rem_limit = limit - len(nodes)
                    res2 = session.run("MATCH (n:Entity) RETURN n LIMIT $rem", rem=rem_limit)
                    for record in res2:
                        n = record["n"]
                        if n["id"] not in nodes:
                            nodes[n["id"]] = {"id": n["id"], "name": n["name"], "category": n["category"]}
                            
                return {
                    "nodes": list(nodes.values()),
                    "edges": links
                }
        except Exception as e:
            logger.error(f"Failed to fetch graph data: {e}")
            return {"nodes": [], "edges": []}
