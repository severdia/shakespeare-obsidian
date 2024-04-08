from .full_book import FullBookFileWriter
from .chapters import ChapterGenerator, retrieve_book_chapters_info
from .characters import CharactersInfoRetriever, CharactersFileWriter, CharacterGenerator
from .settings import FULL_BOOK_FILE_NAME, CHARACTERS_FILE_NAME, CHARACTERS_FOLDER_NAME

class BookGenerator:
    def __init__(self, input_book_path, books_folder):
        self.input_book_path = input_book_path
        self.books_folder = books_folder


    def generate_book(self):
        book_info = self._get_book_info()

        # crate "Full Book" file that contains all chapters
        FullBookFileWriter(book_info).generate_file()

        # create characters file (contains all characters) and make each character clickable to their own file.
        CharactersFileWriter(book_info).generate_characters_file()

        # create character files
        CharacterGenerator(book_info).generate_character_files()

        # create chapter files
        ChapterGenerator(book_info).generate_book_chapters()


    def _get_book_info(self):
        output_book_path = self._create_book_folder()

        # book_obsidian_path = f'{self.books_folder.name}/{output_book_path.name}' # absolute path
        book_obsidian_path = output_book_path.name # relative path
        
        obsidian_paths = {
            'book_path': book_obsidian_path,
            'full_book_path': f'{book_obsidian_path}/{FULL_BOOK_FILE_NAME}',
            'characters_file_path': f'{book_obsidian_path}/{CHARACTERS_FILE_NAME}',
            'characters_folder_path': f'{book_obsidian_path}/{CHARACTERS_FOLDER_NAME}',
        }

        # retrieve information about characters
        char_retriever = CharactersInfoRetriever(self.input_book_path, book_obsidian_path)
        characters_info = char_retriever.retrieve_characters_info()

        # retrieve information about book chapters
        chapters_info = retrieve_book_chapters_info(self.input_book_path, characters_info)

        # get book characters
        book_characters = char_retriever.get_book_characters(chapters_info)

        book_info = {
            'book_name': self.input_book_path.name,
            'input_book_path': self.input_book_path,
            'output_book_path': output_book_path,
            'book_characters': book_characters,
            'chapters_info': chapters_info,
            'obsidian_paths': obsidian_paths
        }

        return book_info


    def _create_book_folder(self):
        book_folder = self.books_folder / self.input_book_path.name
        book_folder.mkdir()

        return book_folder       
