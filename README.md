# Shakespeare-Obsidian

This program creates an Obsidian vault that contains Shakespeare works as markdown files.

## How to generate a vault

### 1. Install/update Python:

Ensure that you have [Python 3](https://www.python.org/) installed on your machine, with a version equal to or greater than `3.6`.

To verify if Python is installed, open your terminal or command prompt and run either of the following commands:

```sh
python --version
```

Or

```sh
python3 --version
```

Choose the appropriate command (`python` or `python3`) depending on which one is installed on your system.

If Python is not installed on your system, you can acquire it by visiting the [official Python website](https://www.python.org/downloads/)


### 2. Generate a Vault:

Open terminal and change your current directory to the parent directory of `create_vault`.
Execute the script with the following command:

```sh
python create_vault markdown
```

The generated vault will be located in the parent directory of the input Markdown folder.

### 3. Optional Output Directory:

If you wish to specify a different folder for the vault to be generated, you can use the `-o` or `--output-dir` option.
For example, to specify a custom output directory run:

```sh
python create_vault markdown -o /path/to/destination/folder
```

Replace `/path/to/destination/folder` with the desired path where you want the vault to be generated.

### 4. Optional Vault Name:

If you wish to specify a vault name other than the default one, you can use the `--vault-name` option. 
For example, to specify a custom vault name run:

```sh
python create_vault markdown --vault-name "My Vault Name"
```

### 5. Getting Help:

- To access help documentation and learn about available options and usage of the script, you can use the following command:

```sh
python create_vault --help
```

<a href="https://www.buymeacoffee.com/severdia" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
