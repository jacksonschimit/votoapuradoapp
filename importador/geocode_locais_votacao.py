"""
Geocodifica os endereços de local_votacao (latitude/longitude) via
Nominatim (OpenStreetMap), pra alimentar o mapa de calor intra-cidade
do drill-down de Município (feedback de produto, 2026-08-17).

Deduplica por endereço (mesma rua/bairro/município podem hospedar
várias zonas no mesmo prédio) pra reduzir o número de chamadas.
Respeita a política de uso do Nominatim: máximo 1 requisição/segundo,
User-Agent identificável. Roda uma vez, grava progresso incremental —
pode ser interrompido e retomado (só busca linhas com latitude NULL).
"""

import time
import sys
from datetime import datetime

import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from db.connection import get_connection

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "VotoApurado-Geocoding/1.0 (uso interno, contato: jacksonschimit@gmail.com)"
INTERVALO_SEGUNDOS = 1.1  # política do Nominatim: máx. 1 req/s

LOG_FALHAS = "geocode_falhas.log"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=15),
    retry=retry_if_exception_type(requests.RequestException),
)
def geocodificar(endereco_query: str) -> tuple[float, float] | None:
    resposta = requests.get(
        NOMINATIM_URL,
        params={"q": endereco_query, "format": "json", "limit": 1, "countrycodes": "br"},
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    resposta.raise_for_status()
    dados = resposta.json()
    if not dados:
        return None
    return float(dados[0]["lat"]), float(dados[0]["lon"])


def main():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            select array_agg(lv.id) as ids, lv.endereco, lv.bairro, m.nome_municipio, lv.sigla_uf
            from local_votacao lv
            join municipio m on m.codigo_ibge = lv.codigo_municipio
            where lv.latitude is null and lv.endereco is not null
            group by lv.endereco, lv.bairro, m.nome_municipio, lv.sigla_uf
            order by m.nome_municipio
            """
        )
        grupos = cur.fetchall()

    total = len(grupos)
    print(f"[{datetime.now():%H:%M:%S}] {total} endereços únicos para geocodificar "
          f"(estimativa: ~{total * INTERVALO_SEGUNDOS / 60:.0f} min)", flush=True)

    ok, falhas = 0, 0
    falhas_arquivo = open(LOG_FALHAS, "a", encoding="utf-8")

    for i, (ids, endereco, bairro, nome_municipio, uf) in enumerate(grupos, start=1):
        partes = [p for p in [endereco, bairro, nome_municipio, uf, "Brasil"] if p]
        query = ", ".join(partes)

        try:
            resultado = geocodificar(query)
        except requests.RequestException as e:
            resultado = None
            print(f"  erro de rede em '{query}': {e}", file=sys.stderr, flush=True)

        if resultado:
            lat, lon = resultado
            with conn.cursor() as cur:
                cur.execute(
                    "update local_votacao set latitude = %s, longitude = %s where id = any(%s)",
                    (lat, lon, ids),
                )
            conn.commit()
            ok += 1
        else:
            falhas += 1
            falhas_arquivo.write(f"{query}\n")
            falhas_arquivo.flush()

        if i % 25 == 0 or i == total:
            print(f"[{datetime.now():%H:%M:%S}] {i}/{total} processados "
                  f"({ok} ok, {falhas} sem resultado)", flush=True)

        time.sleep(INTERVALO_SEGUNDOS)

    falhas_arquivo.close()
    conn.close()
    print(f"[{datetime.now():%H:%M:%S}] Concluído: {ok} geocodificados, {falhas} sem resultado "
          f"(ver {LOG_FALHAS}).", flush=True)


if __name__ == "__main__":
    main()
