#! /usr/bin/env node
import { styleText } from "node:util";
import readline from "node:readline/promises";
import { cp, mkdir } from "node:fs/promises";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import util from "util";
const execPromise = util.promisify(exec);

interface ITemplate {
  name: string;
  template: "frontend" | "package";
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const target: ITemplate = {
  name: "app",
  template: "frontend",
};

const processPath = process.cwd();

/**
 * ask application name and type
 */
async function prompt() {
  const template = await rl.question(
    "Quel type de modèles (frontend/package) :",
  );
  const name = await rl.question(`Quel nom d'application :`);
  target.template = template === "package" ? "package" : "frontend";
  target.name = name || `app-${Date.now()}`;
  rl.close();
}

/**
 * Create directory for the new app and copy template
 */
async function createDirectory() {
  try {
    const dest = `${processPath}/${target.name}`;
    console.log(styleText("yellow", "Création du dossier"));
    await mkdir(dest);
    console.log(styleText("green", "Création du dossier réussi."));
    console.log(styleText("yellow", "Copie du modèle"));
    const copyFrom = path.resolve(fileURLToPath(import.meta.url), "../..");
    await cp(`${copyFrom}/templates/${target.template}`, dest, {
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
async function modifyFiles() {
  console.log(styleText("yellow", "Mise à jour des fichiers."));
  try {
    const packageFile = await readFile(process.cwd() + "/package.json", "utf8");
    const data = JSON.parse(packageFile);
    data["name"] = target.name;
    await writeFile(
      process.cwd() + "/package.json",
      JSON.stringify(data, null, 2),
    );
    const htmlFile = await readFile(process.cwd() + "/index.html", "utf8");
    const html = htmlFile.replace("template", target.name);
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
async function install() {
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

/**
 * run process
 */
prompt()
  .then(createDirectory)
  .then(modifyFiles)
  .then(install)
  .catch((error) => console.log(styleText("red", `${error}`)));
