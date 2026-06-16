export const addMessage = (role: "user" | "assistant", content: string) => {
  return {
    role,
    content,
    addedMs: Date.now(),
  };
};
