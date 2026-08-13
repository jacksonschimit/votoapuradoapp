import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]

ARQUIVOS_TSE_DIR = BASE_DIR.parent / "arquivostse"
REFERENCIA_DIR = BASE_DIR / "referencia"

UF_ALVO = "PR"
ANO_ELEICAO = 2022
TURNO = 1

CARGOS_ALVO = {"PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL"}

# Presidente é candidatura de abrangência nacional — não aparece nos
# arquivos por UF do TSE, só nos arquivos "_BR" (candidatos e votação).
CARGOS_NACIONAIS = {"PRESIDENTE"}
