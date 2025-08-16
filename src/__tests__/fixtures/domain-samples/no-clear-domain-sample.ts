// Sample file with no clear domain - should return null
const x = 5;
const y = 10;

function doSomething() {
  return x + y;
}

function anotherFunction() {
  console.log('Hello world');
}

const randomData = {
  foo: 'bar',
  baz: 42
};

export { doSomething, anotherFunction, randomData };
