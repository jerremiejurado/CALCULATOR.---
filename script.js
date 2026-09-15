const form = document.querySelector('#calculator-form');
const input = document.querySelector('#command-input');
const output = document.querySelector('#output');
const message = document.querySelector('#command-message');

const helpText = [
  'Commands',
  '  add <numbers>          Add multiple numbers',
  '  + <numbers>            Add multiple numbers',
  '  add -f <numbers>       Add floating-point numbers',
  '  even <numbers>         Add only the even numbers',
  '  odd <numbers>          Add only the odd numbers',
  '  subtract <a> <b>      Subtract two numbers',
  '  - <a> <b>             Subtract two numbers',
  '  multiply <a> <b>      Multiply two numbers',
  '  * <a> <b>             Multiply two numbers',
  '  divide <a> <b>        Divide two numbers',
  '  / <a> <b>             Divide two numbers',
  '  power <a> <b>         Raise a to the power of b',
  '  sqrt <number>          Find a square root',
  '  help or ?              Show this help',
].join('\n');

const commandHelp = {
  add: 'Usage: add [-f] <numbers>\nAdds two or more numbers. Use -f for decimals.',
  even: 'Usage: even <numbers>\nAdds only the even numbers provided.',
  odd: 'Usage: odd <numbers>\nAdds only the odd numbers provided.',
  subtract: 'Usage: subtract <a> <b>\nSubtracts b from a.',
  multiply: 'Usage: multiply <a> <b>\nMultiplies a by b.',
  divide: 'Usage: divide <a> <b>\nDivides a by b.',
  power: 'Usage: power <a> <b>\nRaises a to the power of b.',
  sqrt: 'Usage: sqrt <number>\nFinds the square root of a number.',
};

function parseNumbers(values, allowFloat) {
  if (values.length === 0) {
    throw new Error('Add at least one number.');
  }
  if (!allowFloat && values.some((value) => !/^-?\d+$/.test(value))) {
    throw new Error('Use whole numbers, or add the -f flag for decimals.');
  }
  const numbers = values.map(Number);
  if (numbers.some((number) => !Number.isFinite(number))) {
    throw new Error('Every value must be a valid number.');
  }
  return numbers;
}

function formatResult(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
}

function evaluateExpression(expression) {
  const match = expression.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const firstNumber = Number(match[1]);
  const operator = match[2];
  const secondNumber = Number(match[3]);
  if (operator === '/' && secondNumber === 0) throw new Error('Cannot divide by zero.');
  const operations = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b };
  return `= ${formatResult(operations[operator](firstNumber, secondNumber))}`;
}

function runCommand(rawCommand) {
  const expressionResult = evaluateExpression(rawCommand.trim());
  if (expressionResult) return expressionResult;
  const parts = rawCommand.trim().split(/\s+/);
  const command = parts.shift().toLowerCase();

  if (command === 'help' || command === '?' || command === '-h' || command === '--help') return helpText;
  const aliases = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
  const normalizedCommand = aliases[command] || command;
  if (normalizedCommand === 'add') {
    const allowFloat = parts[0] === '-f';
    if (allowFloat) parts.shift();
    const numbers = parseNumbers(parts, allowFloat);
    return `= ${formatResult(numbers.reduce((total, number) => total + number, 0))}`;
  }
  if (commandHelp[normalizedCommand] && (parts[0] === '-h' || parts[0] === '--help')) return commandHelp[normalizedCommand];
  if (normalizedCommand === 'even' || normalizedCommand === 'odd') {
    const numbers = parseNumbers(parts, false).filter((number) => normalizedCommand === 'even' ? number % 2 === 0 : number % 2 !== 0);
    return numbers.length ? `= ${numbers.reduce((total, number) => total + number, 0)}` : `No ${normalizedCommand} numbers found.`;
  }
  if (['subtract', 'multiply', 'divide', 'power'].includes(normalizedCommand)) {
    const numbers = parseNumbers(parts, true);
    if (numbers.length !== 2) throw new Error(`${normalizedCommand} needs exactly two numbers.`);
    if (normalizedCommand === 'divide' && numbers[1] === 0) throw new Error('Cannot divide by zero.');
    const operations = { subtract: (a, b) => a - b, multiply: (a, b) => a * b, divide: (a, b) => a / b, power: (a, b) => a ** b };
    return `= ${formatResult(operations[normalizedCommand](numbers[0], numbers[1]))}`;
  }
  if (command === 'sqrt') {
    const numbers = parseNumbers(parts, true);
    if (numbers.length !== 1) throw new Error('sqrt needs exactly one number.');
    if (numbers[0] < 0) throw new Error('Cannot find the square root of a negative number.');
    return `= ${formatResult(Math.sqrt(numbers[0]))}`;
  }
  throw new Error(`Unknown command "${command}". Type help to see available commands.`);
}

function addOutput(command, result, isError = false) {
  const entry = document.createElement('div');
  entry.className = `command-entry${isError ? ' error' : ''}`;
  const commandLine = document.createElement('p');
  const prompt = document.createElement('span');
  prompt.className = 'prompt';
  prompt.textContent = '$';
  commandLine.append(prompt, ` ${command}`);
  const resultLine = document.createElement('pre');
  resultLine.textContent = result;
  entry.append(commandLine, resultLine);
  output.append(entry);
  output.scrollTop = output.scrollHeight;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = input.value.trim();
  if (!command) {
    message.textContent = 'Enter a command to get started.';
    message.classList.add('error');
    input.focus();
    return;
  }
  try {
    addOutput(command, runCommand(command));
    message.textContent = 'Command completed.';
    message.classList.remove('error');
  } catch (error) {
    addOutput(command, error.message, true);
    message.textContent = 'That command needs another look.';
    message.classList.add('error');
  }
  input.value = '';
  input.focus();
});
