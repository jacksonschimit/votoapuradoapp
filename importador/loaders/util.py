import csv

from config import REFERENCIA_DIR

CSV_PATH = REFERENCIA_DIR / "municipio_tse_ibge.csv"

NULOS_TSE = {"#NULO", "#NE", "", None}


def tse_null(value):
    return None if value in NULOS_TSE else value


def carregar_mapa_municipio_tse_ibge() -> dict[int, int]:
    mapa = {}
    with open(CSV_PATH, encoding="latin-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            mapa[int(row["CD_MUNICIPIO_TSE"])] = int(row["CD_MUNICIPIO_IBGE"])
    return mapa
