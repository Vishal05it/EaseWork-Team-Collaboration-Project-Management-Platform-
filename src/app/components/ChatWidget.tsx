"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { baseURL } from "../utils/baseURL";
import { errorEmitter, successEmitter } from "../utils/emitter";
import { useAllContexts } from "../context/AllContext";
import BotMessageCard from "./BotMessageCard";
import { addMessage } from "../utils/ai/addMessage";
import BotLoader from "./BotLoader";
import { checkLogin } from "../utils/checkLogin";
import { useRouter } from "next/navigation";

export default function ChatWidget() {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const {
    botMessages,
    setBotMessages,
    user,
    pageLoading,
    setPageLoading,
    isLogin,
    setIsLogin,
  } = useAllContexts();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [leftIdx, setLeftIdx] = useState<number>(0);
  const [bottomIdx, setBottomIdx] = useState<number>(0);
  const getHistory = async () => {
    try {
      setPageLoading(true);
      let response = await fetch(`${baseURL}/chat/${user._id}`);
      let chatData = await response.json();
      console.log(chatData);
      if (chatData.success) {
        successEmitter(chatData.message);
        setBotMessages(chatData.messages);
      } else errorEmitter(chatData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setPageLoading(false);
    }
  };
  const sendMessage = async () => {
    if (!message) {
      errorEmitter("Cannot send empty message");
      return;
    }
    try {
      setLoading(true);

      let response = await fetch(`${baseURL}/chat`, {
        method: "POST",
        body: JSON.stringify({
          content: message,
          userId: user._id,
          // chatHistory: botMessages,
        }),
      });
      let chatData = await response.json();
      //console.log(chatData);
      if (chatData.success) {
        // successEmitter(chatData.message);
        setBotMessages((prev) => [
          ...prev,
          addMessage("assistant", chatData.message),
        ]);
      } else {
        errorEmitter(chatData.message);
      }
      setBotMessages((prev) =>
        prev.filter(
          (msg) => (msg.role === "assistant" && msg.content) !== "Thinking...",
        ),
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const executeCheckLogin = async () => {
    try {
      if (isLogin) {
        let loggedData = await checkLogin(user._id);
        if (loggedData) {
          setIsLogin(true);
          return true;
        } else {
          setIsLogin(false);
          router.push("/login");
          return false;
        }
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };
  useEffect(() => {
    const fetchMessages = async () => {
      let result = await executeCheckLogin();
      if (result) {
        await getHistory();
      }
    };
    if (isLogin && user._id) {
      fetchMessages();
    }
  }, [isLogin]);
  useEffect(() => {
    let lastMsg = document.getElementById(
      `botMsgId:#pxhy:${botMessages.length - 1}`,
    );
    lastMsg?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages, open]);
  useEffect(() => {
    if (!isLogin) {
      setOpen(false);
    }
  }, [isLogin]);

  return (
    <>
      {isLogin && (
        <button
          // style={{
          //   left: isDragging ? leftIdx : "24px",
          //   top: isDragging ? bottomIdx : "80%",
          // }}
          onClick={() => {
            setOpen(!open);
          }}
          // onMouseDown={() => {
          //   setIsDragging(true);
          // }}
          // onMouseUp={() => {
          //   setIsDragging(false);
          // }}
          className={`fixed bottom-6 left-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-black dark:bg-violet-600 text-white shadow-xl transition hover:scale-105`}
        >
          <MessageCircle size={28} />
        </button>
      )}
      {open && (
        <div
          className={`fixed bottom-24 left-6 z-50 flex h-150 w-115 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl`}
        >
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold text-black text-lg">EaseWork AI</h2>

              <p className="text-sm text-gray-500">AI Assistant</p>
            </div>

            <button className="text-red-600" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {pageLoading ? (
              <BotLoader />
            ) : (
              <>
                {botMessages.length > 0 ? (
                  botMessages.map((botMessage, idx) => {
                    return (
                      <BotMessageCard
                        key={idx}
                        index={idx}
                        role={botMessage.role}
                        content={botMessage.content}
                      />
                    );
                  })
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-black dark:text-blue-600">
                    No messages
                  </div>
                )}
              </>
            )}
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                placeholder="Ask anything..."
                className="flex-1 text-black rounded-xl border p-3 outline-none"
              />
              <button
                disabled={loading}
                onClick={async () => {
                  if (message.length > 0) {
                    setBotMessages((prev) => [
                      ...prev,
                      addMessage("user", message),
                    ]);
                    setBotMessages((prev) => [
                      ...prev,
                      addMessage("assistant", "Thinking..."),
                    ]);
                    setMessage("");
                  }
                  await sendMessage();
                }}
                className="rounded-xl bg-black p-3 text-white"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
