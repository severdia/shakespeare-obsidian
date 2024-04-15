import shutil

from .books import BookGenerator
from .settings import EMPTY_VAULT_PATH, FOLDER_TO_COPY_INTO_VAULT
from .settings import VAULT_BOOKS_FOLDER_NAME
from .utils import copy_file

class VaultGenerator:
    def __init__(self, options):
        self.options = options

        self.input_folder = options.get('input_folder')
        self.output_folder = options.get('output_folder')
        self.vault_name = options.get('vault_name')

        self.empty_vault = EMPTY_VAULT_PATH


    def generate_vault(self):
        self.output_vault = self._create_output_vault_folder()
        self.books_folder = self._create_books_folder()

        # generate vault books
        for input_path in self.input_folder.iterdir():
            if input_path.is_file():
                copy_file(input_path, self.books_folder)
            elif input_path.is_dir():
                book_generator = BookGenerator(input_path, self.books_folder)
                book_generator.generate_book()


    def _create_output_vault_folder(self):
        output_vault = self.output_folder / self.vault_name
        counter = 1
        while output_vault.exists():
            output_vault = self.output_folder / f'{self.vault_name} {counter}'
            counter += 1

        # copy contents from empty vault
        shutil.copytree(str(self.empty_vault), str(output_vault))

        # copy contents from FOLDER_TO_COPY_INTO_VAULT
        for child_path in FOLDER_TO_COPY_INTO_VAULT.iterdir():
            if child_path.is_file():
                shutil.copy(str(child_path), str(output_vault))
            elif child_path.is_dir():
                shutil.copytree(str(child_path), str(output_vault / child_path.name))

        return output_vault
    

    def _create_books_folder(self):
        books_folder = self.output_vault / VAULT_BOOKS_FOLDER_NAME
        books_folder.mkdir()

        return books_folder