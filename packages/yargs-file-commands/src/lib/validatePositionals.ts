import type { Argv, CommandBuilder, CommandModule, PositionalOptions } from 'yargs';
import yargs from 'yargs';

/**
 * Extracts positional argument names from a command string.
 * Handles patterns like: "create <name>", "create <name> [optional]", etc.
 *
 * @param commandString - The command string (e.g., "create <serviceAccount> <token>")
 * @returns Array of positional argument names found in the command string
 */
export function extractPositionalsFromCommandString(commandString: string | readonly string[] | undefined): string[] {
  if (!commandString) {
    return [];
  }

  // Handle array of command strings (take the first one)
  const cmd = Array.isArray(commandString) ? commandString[0] : commandString;
  if (!cmd || typeof cmd !== 'string') {
    return [];
  }

  // Match patterns like <name> or [name] in the command string
  // Examples:
  // - "create <serviceAccount> <token>" -> ["serviceAccount", "token"]
  // - "create <name> [optional]" -> ["name", "optional"]
  // - "create" -> []
  const positionalPattern = /[<[]([^>\]]+)[>\]]/g;
  const positionals: string[] = [];
  let match: RegExpExecArray | null = positionalPattern.exec(cmd);

  while (match !== null) {
    if (match[1]) {
      positionals.push(match[1]);
    }
    match = positionalPattern.exec(cmd);
  }

  return positionals;
}

/**
 * Extracts positional argument names from a builder function by executing it
 * with a mock yargs instance and tracking what positionals are registered.
 *
 * @param builder - The command builder function
 * @returns Array of positional argument names registered in the builder
 */
export async function extractPositionalsFromBuilder(builder: CommandBuilder | undefined): Promise<string[]> {
  if (!builder) {
    return [];
  }

  // CommandBuilder can be a function or an object - we only validate function builders
  if (typeof builder !== 'function') {
    // Object builders don't use .positional() calls, so no positionals to extract
    return [];
  }

  // Track positional arguments by creating a wrapper around yargs
  const positionals: string[] = [];
  const mockYargs = yargs([]);

  // Wrap the positional method to track calls
  const originalPositional = mockYargs.positional.bind(mockYargs);
  // biome-ignore lint/suspicious/noExplicitAny: Need to override yargs positional method to track calls
  (mockYargs as any).positional = (name: string, config: PositionalOptions) => {
    positionals.push(name);
    return originalPositional(name, config);
  };

  // Execute the builder function
  try {
    const result = builder(mockYargs as Argv<unknown>);
    // Handle both sync and async builders
    await (result instanceof Promise ? result : Promise.resolve(result));
  } catch {
    // If builder throws, we can't validate - this is okay, yargs will catch it later
    // We'll just return what we've collected so far
  }

  return positionals;
}

/**
 * Validates that positional arguments registered in the builder match
 * those declared in the command string.
 *
 * @param commandModule - The command module to validate
 * @param filePath - Path to the command file (for error messages)
 * @throws Error if validation fails and positionals don't match
 */
export async function validatePositionals(commandModule: CommandModule, filePath: string): Promise<void> {
  const commandString = commandModule.command;
  const builder = commandModule.builder;

  // Extract positionals from command string
  const commandStringPositionals = extractPositionalsFromCommandString(commandString);

  // Extract positionals from builder
  const builderPositionals = await extractPositionalsFromBuilder(builder);

  // If builder has positionals but command string doesn't, that's an error
  if (builderPositionals.length > 0 && commandStringPositionals.length === 0) {
    throw new Error(
      `Command in ${filePath} has ${builderPositionals.length} positional argument(s) registered in builder ` +
        `(${builderPositionals.join(', ')}) but none declared in command string "${commandString}". ` +
        `Positional arguments must be declared in the command string (e.g., "create <arg1> <arg2>").`,
    );
  }

  // Check if all builder positionals are in command string
  const missingInCommandString = builderPositionals.filter((pos) => !commandStringPositionals.includes(pos));

  if (missingInCommandString.length > 0) {
    throw new Error(
      `Command in ${filePath} has positional argument(s) registered in builder ` +
        `(${missingInCommandString.join(', ')}) that are not declared in command string "${commandString}". ` +
        `All positional arguments must be declared in the command string (e.g., "create <arg1> <arg2>").`,
    );
  }

  // Check if command string has positionals not in builder (warning case, but not an error)
  // This is allowed - you can declare positionals in command string without registering them
  // But we'll still validate the reverse (builder positionals must be in command string)
}
