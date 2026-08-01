import asyncio
from app.services.graph_service import GraphBuilder
from app.services.weaviate_service import WeaviateService

async def test():
    print("Testing Neo4j...")
    try:
        gb = GraphBuilder()
        if gb.driver:
            print("Neo4j Connected successfully!")
        else:
            print("Neo4j Failed to connect (driver is None)")
    except Exception as e:
        print(f"Neo4j Error: {e}")

    print("Testing Weaviate...")
    try:
        ws = WeaviateService()
        if ws.client:
            print("Weaviate Connected successfully!")
            # test schema
            if ws.client.schema.exists("DocumentChunk"):
                print("Weaviate Schema exists!")
            else:
                print("Weaviate Schema missing!")
        else:
            print("Weaviate Failed to connect (client is None)")
    except Exception as e:
        print(f"Weaviate Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
