from .chapters import ChapterGenerator, retrieve_book_chapters_info
from .characters import CharactersInfoRetriever, CharactersFileWriter, CharacterGenerator

class BookGenerator:
    def __init__(self, input_book_path, books_folder):
        self.input_book_path = input_book_path
        self.books_folder = books_folder


    def generate_book(self):
        self.output_book_path = self._create_book_folder()

        # retrieve information about characters
        characters_info_retriever = CharactersInfoRetriever(self.input_book_path, self.books_folder)
        characters_info = characters_info_retriever.retrieve_characters_info()

        # retrieve information about book chapters
        chapters_info = retrieve_book_chapters_info(self.input_book_path, characters_info)

        # get book characters
        book_characters = characters_info_retriever.get_book_characters(chapters_info)

        # create characters file (contains all characters) and make each character clickable to their own file.
        character_file_writer = CharactersFileWriter(self.input_book_path, self.output_book_path, self.books_folder, book_characters)
        character_file_writer.generate_characters_file()

        # create character files
        character_generator = CharacterGenerator(self.output_book_path, book_characters, self.books_folder)
        character_generator.generate_character_files()

        # create chapter files
        chapter_generator = ChapterGenerator(self.input_book_path, self.output_book_path, self.books_folder, chapters_info, book_characters)
        chapter_generator.generate_book_chapters()


    def _create_book_folder(self):
        book_folder = self.books_folder / self.input_book_path.name
        book_folder.mkdir()

        return book_folder
