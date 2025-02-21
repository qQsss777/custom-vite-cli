#! /usr/bin/env node
import Installer from "./libs/Installer.js";
import Prompt from "./libs/Prompt.js";

const prompt = new Prompt({
  questions: [
    {
      label: "Quel nom d'application ?",
      defaultValue: `app-${Date.now()}`,
    },
    {
      label: "Quel type d'application ?",
      options: ["frontend", "package"],
      defaultValue: "frontend",
    },
  ],
});
prompt.addListener("finished", async (data: string[]) => {
  const installer = new Installer({
    name: data[0],
    appType: data[1],
  });
  try {
    await installer.exec();
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
});
prompt.start();
