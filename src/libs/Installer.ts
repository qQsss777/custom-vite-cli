import { styleText } from "node:util";
import { cp, mkdir } from "node:fs/promises";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import util from "util";
const execPromise = util.promisify(exec);

interface IInstallerConstructor {
  name: string;
  appType: string;
}

interface IInstallerProperties extends IInstallerConstructor {
  exec: () => Promise<void>;
}

export default class Installer implements IInstallerProperties {
  name: string;
  appType: string;

  private processPath = process.cwd();
  constructor(props: IInstallerConstructor) {
    this.name = props.name;
    this.appType = props.appType;
  }

  /**
   * Execute creation and installation
   */
  async exec() {
    try {
      await this.createDirectory();
      await this.modifyFiles();
      await this.install();
    } catch (error) {
      console.error(error);
      throw new Error("Echec de la création.");
    }
  }

  async createDirectory() {
    try {
      const dest = `${this.processPath}/${this.name}`;
      console.log(styleText("yellow", "Création du dossier"));
      await mkdir(dest);
      console.log(styleText("green", "Création du dossier réussi."));
      console.log(styleText("yellow", "Copie du modèle"));
      const copyFrom = path.resolve(fileURLToPath(import.meta.url), "../../..");
      await cp(`${copyFrom}/templates/${this.appType}`, dest, {
        recursive: true,
      });
      console.log(styleText("green", "Copie du modèle réussi."));
      console.log(styleText("yellow", "Changement de répertoire."));
      chdir(dest);
      console.log(styleText("green", "Changement de répertoire réussi."));
    } catch (error) {
      console.error(error);
      throw new Error("Echec de la création du dossier.");
    }
  }

  /**
   * Modify package json and html
   */
  async modifyFiles() {
    console.log(styleText("yellow", "Mise à jour des fichiers."));
    try {
      const packageFile = await readFile(
        process.cwd() + "/package.json",
        "utf8",
      );
      const data = JSON.parse(packageFile);
      data["name"] = this.name;
      await writeFile(
        process.cwd() + "/package.json",
        JSON.stringify(data, null, 2),
      );
      const htmlFile = await readFile(process.cwd() + "/index.html", "utf8");
      const html = htmlFile.replace("template", this.name);
      await writeFile(process.cwd() + "/index.html", html);
      console.log(styleText("green", "Mise à jour des fichiers réussie."));
    } catch (error) {
      console.error(error);
      throw new Error("Echec de la mise à jour des fichiers.");
    }
  }

  /**
   * install library
   */
  async install() {
    console.log(styleText("yellow", "Installation des dépendances."));
    try {
      const { stdout, stderr } = await execPromise("npm install");
      console.log(styleText("green", stdout));
      console.log(styleText("red", stderr));
      console.log(styleText("green", "Installation réussie."));
    } catch (error) {
      console.error(error);
      throw new Error("Echec de l'installation.");
    }
  }
}
