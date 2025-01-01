export const describe = 'Tells you a short joke';

export const handler = async () => {
  console.log(
    `Q: Why did the TypeScript developer get kicked out of the library?\n` +
      `A: They kept trying to enforce strict types on all the books and ` +
      `wouldn't let anyone check anything out without proper type declarations!`
  );
};
