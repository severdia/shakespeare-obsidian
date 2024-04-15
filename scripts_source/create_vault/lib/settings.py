from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parent.parent
REPO_PATH = SCRIPT_PATH.parent.parent

EMPTY_VAULT_PATH = SCRIPT_PATH / 'empty_vault'
FOLDER_TO_COPY_INTO_VAULT = REPO_PATH / 'vault'

# the folder in output vault that will contain all Shakespeare books
VAULT_BOOKS_FOLDER_NAME = 'Shakespeare'

# every book should have a file that contains all chapters contents
FULL_BOOK_FILE_NAME = '++Full Play'

# every book in the initial folder should have a single file 
# which contains the list of all characters in the book
CHARACTERS_FILE_NAME = '+Dramatis Personae'

# for every book will be generated a folder which will contain all character files
CHARACTERS_FOLDER_NAME = 'Characters'

DEFAULT_OUTPUT_VAULT_NAME = 'Shakespeare Vault'