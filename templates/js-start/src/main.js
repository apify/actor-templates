// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// For more information, see https://docs.apify.com/sdk/js/
import { Actor } from 'apify';

await Actor.init()

console.log('Loading input');
// Structure of input is defined in input_schema.json.
const input = await Actor.getInput();
console.log('First number: ', input?.firstNumber);
console.log('Second number: ', input?.secondNumber);

// 👉 Complete the code so that result is
// the sum of firstNumber and secondNumber.
// 👇👇👇👇👇👇👇👇👇👇
const result = null;
// 👆👆👆👆👆👆👆👆👆👆

console.log('The result is: ', result);

// Structure of output is defined in .actor/actor.json
await Actor.pushData({
    firstNumber: input?.firstNumber,
    secondNumber: input?.secondNumber,
    sum: result,
});

await Actor.exit();
