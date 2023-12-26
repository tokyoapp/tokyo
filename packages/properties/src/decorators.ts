// decorators
function Property<T>(originalMethod: any, context: ClassFieldDecoratorContext) {
  console.log(originalMethod, context);

  return function <T>(this: any, ...args: any[]) {
    console.log(this, args);
  };
}

Property.Text = function PropertyTextDecorator<T>(options: T) {
  console.log(options);

  return function PropertyText<T>(originalMethod: any, context: ClassFieldDecoratorContext) {
    console.log(originalMethod, context);

    return function <T>(this: any, ...args: any[]) {
      console.log(this, args);

      return 'asd';
    };
  };
};

class Model {
  @Property.Text({ label: 'test' })
  name = 'test';
}
