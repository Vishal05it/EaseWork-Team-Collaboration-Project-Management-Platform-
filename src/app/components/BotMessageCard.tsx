import React from "react";
import ButtonLoading from "./ButtonLoading";
type Props = {
  index: number;
  role: "user" | "assistant";
  content: string;
};
function BotMessageCard({ index, role, content }: Props) {
  return (
    <>
      <div id={`botMsgId:#pxhy:${index}`} className="space-y-4 p-4">
        {/* AI Message */}

        <div
          className={role != "user" ? `flex justify-start` : `flex justify-end`}
        >
          <div
            className={
              role != "user"
                ? `relative max-w-[80%] rounded-2xl rounded-bl-md bg-zinc-200 px-4 py-3 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100`
                : `relative max-w-[80%] rounded-2xl rounded-bl-md bg-indigo-500 px-4 py-3 text-zinc-100 dark:bg-indigo-600 dark:text-zinc-100`
            }
          >
            <p className="flex items-center gap-2">
              {content}{" "}
              {role == "assistant" && content == "Thinking..." ? (
                <>
                  <ButtonLoading />
                </>
              ) : (
                ""
              )}
            </p>

            {/* Tail */}

            <div
              className={
                role != "user"
                  ? `absolute -left-2 bottom-0 h-4 w-4 bg-zinc-200 dark:bg-zinc-800 clip-left`
                  : `absolute -right-1 bottom-0 h-4 w-4 bg-indigo-500 dark:bg-indigo-600 clip-right`
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default BotMessageCard;
