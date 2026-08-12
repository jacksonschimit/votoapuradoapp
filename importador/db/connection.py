import psycopg
from tenacity import retry, stop_after_attempt, wait_exponential

from config import DATABASE_URL


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=20))
def get_connection():
    conn = psycopg.connect(DATABASE_URL, autocommit=False)
    # O projeto Supabase (plano free) fica com default_transaction_read_only=on
    # em nível de banco quando passa do limite de armazenamento. Isso não é um
    # bloqueio real de permissão — cada sessão pode reverter para si mesma.
    with conn.cursor() as cur:
        cur.execute("set transaction_read_only = off")
    conn.commit()
    return conn
