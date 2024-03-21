// decorators
function Property<T>(originalMethod: any, context: ClassFieldDecoratorContext) {
  return function <T>(this: any, ...args: any[]) {};
}

Property.Text = function PropertyTextDecorator<T>(options: T) {
  return function PropertyText<T>(
    originalMethod: any,
    context: ClassFieldDecoratorContext,
  ) {
    return function <T>(this: any, ...args: any[]) {
      return "asd";
    };
  };
};

class Model {
  @Property.Text({ label: "test" })
  name = "test";
}
