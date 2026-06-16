type UserMessage = {
  role: "user";
  content: string;
};
export const promptToObject = (message: string) => {
  const result: UserMessage = {
    role: "user",
    content: message,
  };
  return result;
};
