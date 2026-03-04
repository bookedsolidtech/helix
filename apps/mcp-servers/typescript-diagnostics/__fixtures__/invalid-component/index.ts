// This file has intentional TypeScript errors for testing

export const invalidFunction = (value) => {
  // Error 7006: implicit 'any' type
  return value.nonExistentProperty; // May cause errors depending on strict mode
};

export class InvalidClass {
  public name; // Error: missing type annotation

  constructor(name) {
    // Error 7006: implicit 'any' type
    this.name = name;
  }

  public broken(): string {
    return 123; // Error 2322: Type 'number' is not assignable to type 'string'
  }
}

const x: string = 42; // Error 2322: Type 'number' is not assignable to type 'string'
