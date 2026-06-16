"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { baseURL } from "../utils/baseURL";
import { errorEmitter, successEmitter } from "../utils/emitter";
import { useRouter } from "next/navigation";
import { useAllContexts } from "../context/AllContext";
import {
  LogOut,
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import ButtonLoading from "../components/ButtonLoading";
import { checkLogin } from "../utils/checkLogin";

export default function LoginPage() {
  let { btnLoading, setBtnLoading, setUser, setIsLogin, isLogin, user } =
    useAllContexts();

  let [form, setForm] = useState({
    email: "",
    password: "",
  });

  let router = useRouter();

  let onChangeFunc = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  let submitForm = async () => {
    try {
      if (isLogin) {
        errorEmitter("Please log out to log into another account");
        return;
      }

      setBtnLoading(true);

      let response = await fetch(`${baseURL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      let loginData = await response.json();
      //  console.log(loginData);

      if (loginData.success) {
        successEmitter(loginData.message);
        router.push("/");

        localStorage.setItem("tempUserLogin", JSON.stringify(true));
        setIsLogin(true);

        localStorage.setItem(
          "localUser",
          JSON.stringify({
            _id: loginData.user._id,
            name: loginData.user.name,
            email: loginData.user.email,
            profilepic: loginData.user.profilepic,
            companyId: loginData.user.companyId,
            createdAt: loginData.user.createdAt,
          }),
        );

        setUser(loginData.user);
      } else {
        errorEmitter(loginData.message);
        if (loginData.status == 401) {
          let orderRes = await fetch(`${baseURL}/razorpay/order`, {
            method: "POST",
            body: JSON.stringify({
              email: form.email,
              userId: loginData.user._id,
            }),
          });

          let orderData = await orderRes.json();

          if (!orderData.success) {
            errorEmitter(orderData.message);
            return;
          }

          // Open Pop up UI :
          const loadScript = () => {
            return new Promise((resolve) => {
              const script = document.createElement("script");
              script.src = "https://checkout.razorpay.com/v1/checkout.js";
              script.onload = () => {
                resolve(true);
              };
              script.onerror = () => {
                resolve(false);
              };
              document.body.appendChild(script);
            });
          };

          const isLoaded = await loadScript();
          if (!isLoaded) {
            errorEmitter("Failed to load Razorpay SDK");
            return;
          }

          const options = {
            key: orderData.key,
            amount: orderData.order.amount,
            currency: orderData.order.currency,
            order_id: orderData.order.id,
            prefill: {
              email: form.email,
            },
            handler: async function (response: any) {
              let verifyRes = await fetch(`${baseURL}/razorpay/verify`, {
                method: "POST",
                body: JSON.stringify({
                  ...response,
                  userId: loginData.user,
                  orderId: orderData.order.id,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                successEmitter(
                  "Payment successful, your manager account is active now",
                );
                router.push("/login");
              } else errorEmitter(verifyData.message);
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
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
    const fetchLoginStatus = async () => {
      await executeCheckLogin();
    };
    fetchLoginStatus();
  }, [isLogin]);

  return (
    <>
      {isLogin ? (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 dark:from-black dark:via-slate-950 dark:to-black">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <div className="border-b border-slate-200 bg-linear-to-r from-emerald-50 via-white to-emerald-50 px-8 py-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm dark:text-emerald-400">
                  <ShieldCheck className="h-8 w-8" />
                </div>
              </div>

              <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                You are already logged in
              </h1>

              <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                You are currently signed in. Log out first if you want to switch
                accounts.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                  You can return to the dashboard or log out to access another
                  account.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 dark:from-black dark:via-slate-950 dark:to-black">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <div className="border-b border-slate-200 bg-linear-to-r from-indigo-50 via-white to-indigo-50 px-8 py-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 shadow-sm dark:text-indigo-400">
                  <ShieldCheck className="h-8 w-8" />
                </div>
              </div>

              <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                Log in to continue managing your projects and approvals.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await submitForm();
                }}
                className="space-y-5"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </span>

                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                    <Mail className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChangeFunc}
                      required
                      placeholder="youremail@example.com"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </span>

                    <Link
                      href="/forgotpassword"
                      className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                    <LockKeyhole className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={onChangeFunc}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={btnLoading}
                  className="mt-2 w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-indigo-500"
                >
                  {btnLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      Logging in <ButtonLoading />
                    </div>
                  ) : (
                    "Log in"
                  )}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Use your workspace email and password to access your
                  dashboard.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
