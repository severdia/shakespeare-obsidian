from pathlib import Path

BASE_PATH = Path(__file__).resolve().parent.parent

EMPTY_VAULT_PATH = BASE_PATH / 'empty_vault'

PARAGRAPH_TYPE_UNKNOWN = 'unknown'
PARAGRAPH_TYPE_STAGE_DIRECTION = 'stage_direction'
PARAGRAPH_TYPE_SPEECH = 'speech'