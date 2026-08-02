from app.utils.llm_client import get_llm_client

client = get_llm_client()
models = client.models.list()
for m in models.data:
    print(m.id)
