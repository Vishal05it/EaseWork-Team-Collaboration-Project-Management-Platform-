"use client";
type Context = {
  authToken: string;
  setAuthToken: React.Dispatch<React.SetStateAction<string>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  toggleTheme: () => void;
  lightMode: () => void;
  darkMode: () => void;
  btnLoading: boolean;
  setBtnLoading: React.Dispatch<React.SetStateAction<boolean>>;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  pageLoading: boolean;
  setPageLoading: React.Dispatch<React.SetStateAction<boolean>>;
  allNotifications: Notification[];
  setAllNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  cancelLoading: boolean;
  setCancelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  allProjects: APIData[];
  setAllProjects: React.Dispatch<React.SetStateAction<APIData[]>>;
  allTempProjects: APIData[];
  setAllTempProjects: React.Dispatch<React.SetStateAction<APIData[]>>;
  filterRead: number;
  setFilterRead: React.Dispatch<React.SetStateAction<number>>;
  filterUnRead: number;
  setFilterUnRead: React.Dispatch<React.SetStateAction<number>>;
  leaveBtn: boolean;
  setLeaveBtn: React.Dispatch<React.SetStateAction<boolean>>;
  getProfile: (userId: string) => Promise<void>;
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  showFooter: boolean;
  setshowFooter: React.Dispatch<React.SetStateAction<boolean>>;
  project: ProjectHome;
  setProject: React.Dispatch<React.SetStateAction<ProjectHome>>;
  members: Members[];
  setMembers: React.Dispatch<React.SetStateAction<Members[]>>;
  images: Images[];
  setImages: React.Dispatch<React.SetStateAction<Images[]>>;
  pendingImages: PendingImages[];
  setPendingImages: React.Dispatch<React.SetStateAction<PendingImages[]>>;
  allTasks: never[] | any[] | undefined[] | null[];
  setAllTasks: React.Dispatch<
    React.SetStateAction<never[] | any[] | undefined[] | null[]>
  >;
  allMembers: UserPage[];
  setAllMembers: React.Dispatch<React.SetStateAction<UserPage[]>>;
  finishedDate: string;
  setFinishedDate: React.Dispatch<React.SetStateAction<string>>;
  called: boolean;
  setCalled: React.Dispatch<React.SetStateAction<boolean>>;
  socketCall: boolean;
  setSocketCall: React.Dispatch<React.SetStateAction<boolean>>;
  pendingCount: number;
  setPendingCount: React.Dispatch<React.SetStateAction<number>>;
  pendingProjectsCount: number;
  setPendingProjectsCount: React.Dispatch<React.SetStateAction<number>>;
  completeCount: number;
  setCompleteCount: React.Dispatch<React.SetStateAction<number>>;
  activeCount: number;
  setActiveCount: React.Dispatch<React.SetStateAction<number>>;
  prevProject: string;
  setprevProject: React.Dispatch<React.SetStateAction<string>>;
  botMessages: MessageAI[];
  setBotMessages: React.Dispatch<React.SetStateAction<MessageAI[]>>;
};
type MessageAI = {
  role: "user" | "assistant";
  content: string;
  addedMs: number;
};
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
type ProjectHome = {
  title: string;
  description: string;
  _id: string;
  createdMs: number;
  deadline: number;
  isFailed: boolean;
  isDone: boolean;
  deadlineDate: string;
  addedMs: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
type Thumbnail = {
  _id: string;
  url: string;
};
type APIData = {
  thumbnail: Thumbnail;
  project: ProjectHome;
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
type UserPage = {
  _id: string;
  name: string;
  email: string;
  profilepic: string;
  createdAt: string;
  companyId: string;
  isManager: boolean;
};
type Members = {
  _id: string;
  user: UserPage;
  name: string;
  forProject: string;
  isAdmin: boolean;
  designation: string;
};
type Images = {
  _id: string;
  forProject: string;
  url: string;
};
type PendingImages = {
  _id: string;
  forProject: string;
  byUser: User;
  url: string;
};
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { baseURL } from "../utils/baseURL";
import { errorEmitter, successEmitter } from "../utils/emitter";
let allContext = createContext<Context | null>(null);
function AllContext({ children }: { children: ReactNode }) {
  // Optimization :
  const [finishedDate, setFinishedDate] = useState<string>("");
  const [project, setProject] = useState<ProjectHome>({
    _id: "",
    title: "",
    description: "",
    deadline: 0,
    deadlineDate: "",
    createdMs: 0,
    createdBy: "",
    createdAt: "",
    updatedAt: "",
    addedMs: 0,
    isFailed: false,
    isDone: false,
  });
  const [members, setMembers] = useState<Members[]>([]);
  let [allMembers, setAllMembers] = useState<UserPage[]>([]);
  const [images, setImages] = useState<Images[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImages[]>([]);
  const [allTasks, setAllTasks] = useState<
    never[] | any[] | undefined[] | null[]
  >([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingProjectsCount, setPendingProjectsCount] = useState<number>(0);

  let [completeCount, setCompleteCount] = useState<number>(0);

  let [activeCount, setActiveCount] = useState<number>(0);
  // Others :
  let [authToken, setAuthToken] = useState<string>("");
  const storedTheme =
    typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  let [theme, setTheme] = useState<string>(storedTheme ? storedTheme : "light");
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("localUser") : null;
  let [pageLoading, setPageLoading] = useState<boolean>(false);
  const [leaveBtn, setLeaveBtn] = useState<boolean>(false);
  const [called, setCalled] = useState<boolean>(false);
  const [socketCall, setSocketCall] = useState<boolean>(false);
  let [filterRead, setFilterRead] = useState<number>(0);
  let [filterUnRead, setFilterUnRead] = useState<number>(0);
  let [user, setUser] = useState<User>({
    name: storedUser ? JSON.parse(storedUser).name : "",
    email: storedUser ? JSON.parse(storedUser).email : "",
    profilepic: storedUser ? JSON.parse(storedUser).profilepic : "",
    _id: storedUser ? JSON.parse(storedUser)._id : "",
    createdAt: storedUser ? JSON.parse(storedUser).createdAt : "",
    companyId: storedUser
      ? JSON.parse(storedUser).companyId
      : {
          _id: "",
          companyName: "",
          companyPic: "",
        },
    isManager: false,
  });
  const storedLogin =
    typeof window !== "undefined"
      ? localStorage.getItem("tempUserLogin")
      : null;
  let [isLogin, setIsLogin] = useState<boolean>(
    storedLogin ? JSON.parse(storedLogin) : false,
  );
  let [btnLoading, setBtnLoading] = useState<boolean>(false);
  let [showFooter, setshowFooter] = useState<boolean>(true);
  let [cancelLoading, setCancelLoading] = useState<boolean>(false);
  let [prevProject, setprevProject] = useState<string>("");
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  let [allProjects, setAllProjects] = useState<APIData[]>([]);
  let [botMessages, setBotMessages] = useState<MessageAI[]>([]);
  let [allTempProjects, setAllTempProjects] = useState<APIData[]>(allProjects);
  let [unreadMessages, setUnreadMessages] = useState<number>(0);
  let toggleTheme = () => {
    const htmlTag = document.querySelector("html");
    htmlTag?.classList.remove("dark");
    htmlTag?.classList.remove("light");
    if (theme == "light") {
      htmlTag?.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      htmlTag?.classList.add("light");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };
  let darkMode = () => {
    const htmlTag = document.querySelector("html");
    htmlTag?.classList.remove("dark");
    htmlTag?.classList.remove("light");
    htmlTag?.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setTheme("dark");
  };
  let lightMode = () => {
    const htmlTag = document.querySelector("html");
    htmlTag?.classList.remove("dark");
    htmlTag?.classList.remove("light");
    htmlTag?.classList.add("light");
    localStorage.setItem("theme", "light");
    setTheme("light");
  };
  const getProfile = async (userId: string) => {
    try {
      let response = await fetch(`${baseURL}/users/${userId}`);
      let profileData = await response.json();
      console.log(profileData);
      if (profileData.success) {
        successEmitter(profileData.message);
        localStorage.setItem(
          "localUser",
          JSON.stringify({
            _id: profileData.user._id,
            name: profileData.user.name,
            email: profileData.user.email,
            profilepic: profileData.user.profilepic,
            companyId: profileData.user.companyId,
            createdAt: profileData.user.createdAt,
          }),
        );
        setUser(profileData.user);
      } else errorEmitter(profileData.message);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <allContext.Provider
      value={{
        authToken,
        setAuthToken,
        toggleTheme,
        lightMode,
        darkMode,
        theme,
        setTheme,
        btnLoading,
        setBtnLoading,
        user,
        setUser,
        isLogin,
        setIsLogin,
        pageLoading,
        setPageLoading,
        allNotifications,
        setAllNotifications,
        cancelLoading,
        setCancelLoading,
        allProjects,
        setAllProjects,
        allTempProjects,
        setAllTempProjects,
        filterRead,
        setFilterRead,
        filterUnRead,
        setFilterUnRead,
        leaveBtn,
        setLeaveBtn,
        getProfile,
        unreadMessages,
        setUnreadMessages,
        showFooter,
        setshowFooter,
        project,
        setProject,
        members,
        setMembers,
        images,
        setImages,
        pendingImages,
        setPendingImages,
        allTasks,
        setAllTasks,
        allMembers,
        setAllMembers,
        finishedDate,
        setFinishedDate,
        called,
        setCalled,
        pendingCount,
        setPendingCount,
        pendingProjectsCount,
        setPendingProjectsCount,
        completeCount,
        setCompleteCount,
        activeCount,
        setActiveCount,
        prevProject,
        setprevProject,
        socketCall,
        setSocketCall,
        botMessages,
        setBotMessages,
      }}
    >
      {children}
    </allContext.Provider>
  );
}
export const useAllContexts = () => {
  let context = useContext(allContext);
  if (!context) throw new Error("Wrap the Child Node with the context");
  return context;
};
export default AllContext;
