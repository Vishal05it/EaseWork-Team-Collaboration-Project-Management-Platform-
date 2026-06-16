"use client";

import React, { useEffect } from "react";
import { Bell, CheckCircle2, Clock3, MailCheck, BellRing } from "lucide-react";
import { useAllContexts } from "../context/AllContext";
import NotificationCard from "../components/NotificationCard";
import { baseURL } from "../utils/baseURL";
import { errorEmitter, successEmitter } from "../utils/emitter";

type Notification = {
  _id: string;
  byUser: User;
  forUser: User;
  addedMs: number;
  isRead: boolean;
  on: string;
  action: string;
  forProject: Project;
  task: string | null | undefined;
  title: string | null | undefined;
};

type Company = {
  _id: string;
  companyName: string;
  companyPic: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  profilepic: string;
  createdAt: string;
  companyId: Company;
  isManager: boolean;
};

type Project = {
  _id: string;
  title: string;
  description: string;
  createdMs: number;
  isFailed: boolean;
  deadline: number;
  deadlineDate: string;
  addedMs?: number;
  isDone: boolean;
  createdBy: User;
  designation: string;
  forCompany: Company;
};

export default function NotificationsPage() {
  const {
    allNotifications,
    user,
    setAllNotifications,
    filterRead,
    setFilterRead,
    filterUnRead,
    setFilterUnRead,
  } = useAllContexts();

  useEffect(() => {
    if (allNotifications.length == 0) {
      return;
    }

    let tempUnRead = 0;
    let tempRead = 0;

    allNotifications.map((elm) => {
      if (elm.isRead) {
        tempRead++;
      } else tempUnRead++;
    });

    setFilterRead(tempRead);
    setFilterUnRead(tempUnRead);
  }, [allNotifications]);

  const readAllNotifications = async () => {
    try {
      let response = await fetch(`${baseURL}/notifications/${user._id}`, {
        method: "PUT",
      });

      let readAllData = await response.json();
      // console.log(readAllData);

      if (readAllData.success) {
        // successEmitter(readAllData.message);

        setAllNotifications(
          allNotifications.map((elm) => {
            if (!elm.isRead) {
              elm.isRead = true;
            }
            return elm;
          }),
        );
      } else errorEmitter(readAllData.message);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (allNotifications.length > 0) {
      setAllNotifications((prev) =>
        [...prev].sort((a, b) => b.addedMs - a.addedMs),
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-8 dark:from-black dark:via-slate-950 dark:to-black">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="border-b border-slate-200 bg-linear-to-r from-indigo-50 via-white to-indigo-50 px-6 py-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <BellRing className="h-3.5 w-3.5" />
                  Notification Center
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Notifications
                </h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Stay updated with projects, approvals, team activity and
                  important workspace events.
                </p>
              </div>

              <button
                onClick={async () => {
                  await readAllNotifications();

                  setAllNotifications(
                    allNotifications.map((elm) => {
                      elm.isRead = true;
                      return elm;
                    }),
                  );

                  let tempUnRead = 0;
                  let tempRead = 0;

                  allNotifications.map((elm) => {
                    if (elm.isRead) {
                      tempRead++;
                    } else tempUnRead++;
                  });

                  setFilterRead(tempRead);
                  setFilterUnRead(tempUnRead);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md dark:hover:bg-indigo-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark all as read
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                  <Bell className="h-5 w-5" />
                </div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Notifications
                </p>

                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {allNotifications.length}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock3 className="h-5 w-5" />
                </div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Unread
                </p>

                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {filterUnRead}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MailCheck className="h-5 w-5" />
                </div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Read
                </p>

                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {filterRead}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}

        <div className="space-y-5">
          {allNotifications.length > 0 &&
            allNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
              />
            ))}
        </div>

        {/* Empty State */}

        {allNotifications.length === 0 && (
          <div className="overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
            <div className="px-8 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <Bell className="h-7 w-7" />
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No notifications right now. New project updates, approvals and
                activity alerts will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
