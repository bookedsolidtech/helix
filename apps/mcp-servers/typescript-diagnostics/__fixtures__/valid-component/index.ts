export const validFunction = (value: string): number => {
  return value.length;
};

export class ValidClass {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public greet(): string {
    return `Hello, ${this.name}`;
  }
}
