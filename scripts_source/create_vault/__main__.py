from lib.utils import parse_arguments
from lib.vaults import VaultGenerator

if __name__ == '__main__':
    arguments = parse_arguments()
    VaultGenerator(arguments).generate_vault()