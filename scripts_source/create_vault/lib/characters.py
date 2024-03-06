from collections import defaultdict

from .settings import CHARACTERS_FOLDER_NAME, CHARACTERS_FILE_NAME

class CharactersInfoRetriever:
    def __init__(self, input_book_path, books_folder):
        self.input_book_path = input_book_path
        self.books_folder = books_folder
        self._characters_info = None

    
    def retrieve_characters_info(self):
        characters_info = []

        # read character complete names from characters file
        complete_names = self._get_characters_complete_names()
        
        for complete_name in complete_names:
            roles = self._get_character_roles(complete_name)

            characters_info.append({
                'complete_name': complete_name,
                'name': self._get_character_name(complete_name),
                'roles': roles,
            })

        # cache names
        self._characters_info = characters_info

        return characters_info


    def get_book_characters(self, chapters_info):
        characters = defaultdict(dict)

        characters_info = self._characters_info if self._characters_info is not None else self.retrieve_characters_info()

        for char_info in characters_info:
            complete_name = char_info['complete_name']
            character_speeches = self._find_character_speeches(char_info, chapters_info, self.input_book_path)

            characters[complete_name]['name'] = char_info['name']
            characters[complete_name]['roles'] = char_info['roles']
            characters[complete_name]['speeches'] = character_speeches
            characters[complete_name]['speech_count'] = sum(len(speech_list) for speech_list in character_speeches.values())
            characters[complete_name]['obsidian_path'] = self.books_folder.name + '/' + self.input_book_path.name + '/' + complete_name

        return characters


    def _get_characters_complete_names(self):
        names = []

        # characters file contains the list of all book characters ("+Dramatis Personae.md")
        book_characters_file = self.input_book_path / CHARACTERS_FILE_NAME

        if not book_characters_file.exists():
            return names

        bullet_prefix = '- '
        with book_characters_file.open('rt', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('## Scenes'):
                    break
                
                if line.startswith(bullet_prefix):
                    names.append(line[2:].strip())

        return names
    
    def _get_character_name(self, complete_name):
        try:
            first_parenthesis = complete_name.rindex('(')
            character_name = complete_name[:first_parenthesis]
        except ValueError:
            character_name = complete_name
            
        return character_name.strip()


    def _get_character_roles(self, complete_name):
        # complete_name has a pattern like this: "PART_OF_NAME (PART_OF_NAME){0,1} (role; role*)"

        try:
            roles_start = complete_name.rindex('(')
            roles_end = complete_name.rindex(')')
        except ValueError:
            return []
        

        roles_string = complete_name[roles_start + 1: roles_end]

        roles = [role.strip() for role in roles_string.split(';')]

        return roles


    def _find_character_speeches(self, char_info, chapters_info, input_book_path):
        character_speeches = {}
        for chapter_file in sorted(input_book_path.iterdir()): # use sorted() to order files by name
            if chapter_file.is_file() and chapter_file.suffix == '.md' and not chapter_file.name.startswith('+'):
                speeches = self._find_character_speeches_in_chapter(char_info, chapters_info, chapter_file, input_book_path)
                character_speeches[chapter_file] = speeches

        return character_speeches


    def _find_character_speeches_in_chapter(self, char_info, chapters_info, chapter_file, input_book_path):
        speeches = []

        chapter_paragraph_info = chapters_info[chapter_file]['paragraphs']

        with chapter_file.open('rt', encoding='utf-8') as f:
            for line_number, line in enumerate(f):
                line = line.strip()
                if line_number in chapter_paragraph_info and char_info in chapter_paragraph_info[line_number]['characters']:
                    speech_number = chapter_paragraph_info[line_number]['paragraph_number']
                    obsidian_path = self.books_folder.name + '/' + input_book_path.name + '/' + chapter_file.stem
                    speeches.append(f'{obsidian_path}#{speech_number}')

        return speeches



class CharactersFileWriter:
    
    def __init__(self, input_book_path, output_book_path, books_folder, book_characters):
        self.input_book_path = input_book_path
        self.output_book_path = output_book_path
        self.books_folder = books_folder
        self.book_characters = book_characters

    
    def generate_characters_file(self):
        input_characters_file = self.input_book_path / CHARACTERS_FILE_NAME
        output_characters_file = self.output_book_path / CHARACTERS_FILE_NAME

        with input_characters_file.open('rt', encoding='utf-8') as input_file:
            lines = input_file.readlines()
            
            with output_characters_file.open('wt', encoding='utf-8') as output_file:
                bullet_prefix = '- '

                for line in lines:
                    obsidian_path_prefix = self.books_folder.name + '/' + self.output_book_path.name + '/' + CHARACTERS_FOLDER_NAME
                    if line.startswith(bullet_prefix):
                        character_complete_name = line[2:].strip()

                        if self.book_characters.get(character_complete_name) is None: # if it's a bulleted line that is not a character
                            output_file.write(line)
                        else:
                            character_has_speeches = self.book_characters[character_complete_name]['speech_count'] > 0
                            character_name = self.book_characters[character_complete_name]['name']
                            character_roles_string = "; ".join(self.book_characters[character_complete_name]['roles'])
                            
                            if character_has_speeches:
                                output_file.write(f'{bullet_prefix}[[{obsidian_path_prefix}/{character_complete_name}|{character_name}]] *({character_roles_string})*\n')
                            else:
                                output_file.write(f'{bullet_prefix}{character_name} *({character_roles_string})*\n')
                    else:
                        output_file.write(line)


class CharacterGenerator:
    def __init__(self, output_book_path, book_characters, books_folder):
        self.output_book_path = output_book_path
        self.book_characters = book_characters
        self.books_folder = books_folder

    def generate_character_files(self):
        """
        for every character in a book (for example: Hamlet is a character in "Hamlet" book)
        generate a separate file and in this file include all character speeches from the book
        """

        # crate 'characters' folder
        characters_folder = self.output_book_path / CHARACTERS_FOLDER_NAME
        characters_folder.mkdir()

        # create a file for every character
        for character_complete_name, character_info in self.book_characters.items():
            self._generate_character_file(character_complete_name, character_info, characters_folder)


    def _generate_character_file(self, character_complete_name, character_info, characters_folder):
        character_file = characters_folder / f'{character_complete_name}.md'

        # check if character have at least one speech, otherwise don't create a character file
        if character_info['speech_count'] < 1:
            return
        
        with character_file.open('wt', encoding='utf-8') as f:
            for chapter_file, speeches_list in character_info['speeches'].items():
                if not speeches_list:
                    continue
                
                chapter_obsidian_path = self.books_folder.name + '/' + self.output_book_path.name + '/' + chapter_file.stem
                chapter_link = f'[[{chapter_obsidian_path}|{chapter_file.stem}]]'

                f.write(f'### {chapter_link}\n\n')

                for speech_link in speeches_list:
                    f.write(f'![[{speech_link}]]\n\n')
