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
          <span
            className={
              role !== "user"
                ? `relative max-w-[85%] overflow-hidden rounded-2xl rounded-bl-md bg-zinc-200 px-4 py-3 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100`
                : `relative max-w-[85%] overflow-hidden rounded-2xl rounded-br-md bg-indigo-500 px-4 py-3 text-white shadow-sm dark:bg-indigo-600`
            }
          >
            <p className="whitespace-pre-wrap wrap-break-word px-2 py-1 leading-7">
              {content}
              {role === "assistant" && content === "Thinking..." && (
                <span className="ml-2 inline-flex">
                  <ButtonLoading />
                </span>
              )}
            </p>

            {/* Tail */}

            <p
              className={
                role != "user"
                  ? `absolute -left-2 bottom-0 h-4 w-4 bg-zinc-200 dark:bg-zinc-800 clip-left`
                  : `absolute -right-1 bottom-0 h-4 w-4 bg-indigo-500 dark:bg-indigo-600 clip-right`
              }
            />
          </span>
        </div>
      </div>
    </>
  );
}

export default BotMessageCard;
