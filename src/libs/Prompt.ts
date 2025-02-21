import { styleText } from "node:util";
import { EventEmitter } from "node:events";

export interface IQuestions {
  label: string;
  options?: string[];
  defaultValue: string;
}

interface IPromptConstructor {
  questions: IQuestions[];
}
interface IPromptProps extends IPromptConstructor {
  start: () => void;
}

export default class Prompt extends EventEmitter implements IPromptProps {
  questions: IQuestions[];
  private questionCursor = -1;
  private choiceCursor = 0;
  private result: string[];
  isChoice = false;
  private cbInline = this.callbackInline.bind(this);
  private cbChoice = this.callbackChoice.bind(this);

  constructor(props: IPromptConstructor) {
    super();
    if (props.questions.length < 1)
      throw new Error("One question is necessary");
    this.questions = props.questions;
    this.result = new Array<string>(this.questions.length);
    process.stdin.setEncoding("utf-8");
  }

  /**
   * Start prompt
   */
  start() {
    this.nextQuestion();
  }

  /**
   * Show next question
   */
  private nextQuestion() {
    const nextValue = this.questionCursor + 1;
    if (nextValue >= this.questions.length) {
      process.stdin.removeAllListeners("data");
      return this.emit("finished", [...this.result]);
    }
    this.questionCursor = nextValue;
    const question = this.questions[this.questionCursor];
    this.result[this.questionCursor] = question.defaultValue;
    process.stdout.write(
      styleText(["underline", "magenta"], `${question.label}\n`),
    );
    if (question.options) {
      this.isChoice = true;
      this.choiceCursor = 0;
      process.stdin.setRawMode(true);
      this.createOptions(question.options);
      process.stdin.on("data", this.cbChoice);
    } else {
      this.isChoice = false;
      process.stdin.setRawMode(false);
      process.stdin.on("data", this.cbInline);
    }
  }

  private createOptions(opts: string[]) {
    for (let i = 0; i < opts.length; i++) {
      const txt =
        i === this.choiceCursor
          ? styleText("green", `> ${opts[i]}\n`)
          : `> ${opts[i]}\n`;
      process.stdout.write(txt);
    }
  }

  /**
   * Get user input value for inline answer
   * @param data data from user input
   * @returns
   */
  private callbackInline(data: Buffer) {
    const d = data.toString();
    if (d === "\u0003") {
      process.stdin.removeAllListeners("data");
      return process.exit();
    }
    if (d !== "") this.result[this.questionCursor] = d.trim();
    process.stdin.removeListener("data", this.cbInline);
    this.nextQuestion();
  }

  /**
   * Get user input value for choice answer
   * @param data data from user input
   * @returns
   */
  private callbackChoice(data: Buffer) {
    const d = data.toString();
    const currentQuestion = this.questions[this.questionCursor];
    const opts = currentQuestion.options as string[];
    const choicesLength = opts.length as number;
    if (d === "\u001b[B") {
      this.deleteLines(choicesLength);
      this.choiceCursor =
        this.choiceCursor < choicesLength - 1
          ? this.choiceCursor + 1
          : this.choiceCursor;
      this.result[this.questionCursor] = opts[this.choiceCursor];
      this.createOptions(opts);
    } else if (d === "\u001b[A") {
      this.deleteLines(choicesLength);
      this.choiceCursor = this.choiceCursor > 0 ? this.choiceCursor - 1 : 0;
      this.result[this.questionCursor] = opts[this.choiceCursor];
      this.createOptions(opts);
    } else if (d === "\r") {
      process.stdin.removeListener("data", this.cbChoice);
      this.nextQuestion();
    } else if (d === "\u0003") {
      process.stdin.removeAllListeners("data");
      return process.exit();
    }
  }

  private deleteLines(nb: number) {
    for (let i = 0; i < nb; i++) {
      process.stdout.write("\x1B[A\x1B[K");
    }
  }
}
