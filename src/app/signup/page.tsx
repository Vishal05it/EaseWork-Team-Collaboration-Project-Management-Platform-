"use client";

import Link from "next/link";
import {
  Upload,
  UserRound,
  Mail,
  KeyRound,
  Building2,
  ShieldCheck,
  Hash,
} from "lucide-react";
import { useEffect, useState } from "react";
import { errorEmitter, successEmitter } from "../utils/emitter";
import { baseURL } from "../utils/baseURL";
import { useRouter } from "next/navigation";
import { useAllContexts } from "../context/AllContext";
import ButtonLoading from "../components/ButtonLoading";

export default function SignupPage() {
  let { btnLoading, setBtnLoading, isLogin } = useAllContexts();

  let [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profilepic: "",
    companyName: "",
    companyId: "",
    companyPic: "",
  });

  let router = useRouter();

  let [image, setImage] = useState<File | null | undefined>(null);
  let [companyPic, setCompanyPic] = useState<File | null | undefined>(null);

  let onChangeFunc = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [role, setRole] = useState<"manager" | "employee">("manager");

  let submitForm = async () => {
    if (isLogin) {
      errorEmitter("Please log out to create a new account");
      return;
    }

    try {
      if (!form.name || !form.email || !form.password) {
        errorEmitter("Name,Email & Password all are required!");
        return;
      }

      if (form.name.length < 2) {
        errorEmitter("Name must be at least 2 characters long");
        return;
      }

      if (form.password.trim().length < 8) {
        errorEmitter("Password must be at least 8 characters long");
        return;
      }

      let tempImg = "";
      let companyImg = "";

      setBtnLoading(true);

      if (image) {
        let formData = new FormData();
        formData.append("image", image);

        let response = await fetch(`${baseURL}/upload`, {
          method: "POST",
          body: formData,
        });

        let uploadData = await response.json();
        // console.log(uploadData);

        if (uploadData.success) {
          tempImg = uploadData.url;
        }
      }

      if (companyPic) {
        let formData = new FormData();
        formData.append("image", companyPic);

        let response = await fetch(`${baseURL}/upload`, {
          method: "POST",
          body: formData,
        });

        let uploadData = await response.json();
        // console.log(uploadData);

        if (uploadData.success) {
          companyImg = uploadData.url;
        }
      }

      // console.log(form.profilepic);

      if (role == "manager") {
        let response = await fetch(`${baseURL}/users/signup`, {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            profilepic: tempImg,
            companyName: form.companyName,
            companyPic: companyImg,
          }),
        });

        let signUpData = await response.json();
        // console.log(signUpData);

        if (signUpData.success) {
          successEmitter(signUpData.message);
        } else {
          errorEmitter(signUpData.message);
          return;
        }

        let orderRes = await fetch(`${baseURL}/razorpay/order`, {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            userId: signUpData.user._id,
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
            name: form.name,
            email: form.email,
          },
          handler: async function (response: any) {
            let verifyRes = await fetch(`${baseURL}/razorpay/verify`, {
              method: "POST",
              body: JSON.stringify({
                ...response,
                userId: signUpData.user._id,
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
      } else {
        let response = await fetch(`${baseURL}/users/signup`, {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            profilepic: tempImg,
            companyId: form.companyId,
            allowed: true,
          }),
        });

        let signUpData = await response.json();
        // console.log(signUpData);

        if (signUpData.success) {
          successEmitter(signUpData.message);
          router.push("/login");
        } else errorEmitter(signUpData.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };
  useEffect(() => {
    if (isLogin) {
      errorEmitter("You are already logged in");
      return router.push("/");
    }
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-8 dark:from-black dark:via-slate-950 dark:to-black">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90">
        {/* Header */}
        <div className="border-b border-slate-200 bg-linear-to-r from-indigo-50 via-white to-indigo-50 px-6 py-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Start your workspace
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {role === "manager"
                  ? "Create Manager Account"
                  : "Join as Employee"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {role === "manager"
                  ? "Start managing your team, projects, approvals, and notifications from one workspace."
                  : "Join your company, collaborate with your team, and stay connected with project updates."}
              </p>

              {role === "manager" && (
                <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/10 dark:text-indigo-300">
                  Manager accounts require a one-time activation payment before
                  the workspace becomes active.
                </div>
              )}
            </div>

            <div className="w-full max-w-60 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 shrink-0 dark:bg-slate-950 sm:w-60">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setRole("manager")}
                  className={`flex min-w-0 items-center justify-center rounded-full px-3 py-3 text-sm font-medium transition-all sm:px-4 ${
                    role === "manager"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className=" whitespace-nowrap">Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("employee")}
                  className={`flex min-w-0 items-center justify-center rounded-full px-3 py-3 text-sm font-medium transition-all sm:px-4 ${
                    role === "employee"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className=" whitespace-nowrap">Employee</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await submitForm();
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </span>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                  <UserRound className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChangeFunc}
                    placeholder="John Doe"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
              </label>

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
                    placeholder="youremail@example.com"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </span>
              <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                <KeyRound className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
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

            {role === "manager" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Company Name
                </span>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                  <Building2 className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={onChangeFunc}
                    placeholder="Enter your company name"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
              </label>
            )}

            {role === "employee" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Company ID
                </span>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-500/20">
                  <Hash className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    name="companyId"
                    value={form.companyId}
                    onChange={onChangeFunc}
                    placeholder="Enter company ID"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
              </label>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Profile Picture
                </label>

                <label
                  htmlFor="uploadpic"
                  className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-indigo-500 dark:hover:bg-slate-900"
                >
                  <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Click to upload image
                    </span>
                    <span className="text-xs">JPG, PNG supported</span>
                    {image && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Profile selected
                      </span>
                    )}
                  </div>
                </label>

                <input
                  id="uploadpic"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImage(e.target.files?.[0]);
                    }
                  }}
                  type="file"
                  className="hidden"
                />
              </div>

              {role == "manager" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Company Logo
                  </label>

                  <label
                    htmlFor="uploadcomp"
                    className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-indigo-500 dark:hover:bg-slate-900"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to upload company logo
                      </span>
                      <span className="text-xs">
                        Required for manager accounts
                      </span>
                      {companyPic && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Logo selected
                        </span>
                      )}
                    </div>
                  </label>

                  <input
                    id="uploadcomp"
                    onChange={(e) => {
                      if (e.target.files) {
                        setCompanyPic(e.target.files?.[0]);
                      }
                    }}
                    type="file"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {role === "manager" && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/10 dark:text-indigo-300">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Manager accounts are activated after payment and can then
                    create a workspace, manage members, and handle projects.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={btnLoading}
              className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-indigo-500"
            >
              {role === "manager" ? (
                btnLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    Creating Account <ButtonLoading />
                  </div>
                ) : (
                  "Create Account"
                )
              ) : btnLoading ? (
                <div className="flex items-center justify-center gap-2">
                  Joining Company <ButtonLoading />
                </div>
              ) : (
                "Join Company"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
