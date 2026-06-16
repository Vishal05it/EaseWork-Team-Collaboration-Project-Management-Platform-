"use client";
type User = {
  _id: string;
  email: string;
  name: string;
  profilepic: string;
  companyId: string;
  isManager: boolean;
  createdAt: string;
};
type Members = {
  _id: string;
  user: User;
  name: string;
  forProject: string;
  isAdmin: boolean;
  designation: string;
};
type PendingImages = {
  _id: string;
  forProject: string;
  byUser: User;
  url: string;
};

type Images = {
  _id: string;
  forProject: string;
  url: string;
};
type Project = {
  _id: string;
  title: string;
  description: string;
  createdMs: number;
  isFailed: boolean;
  deadline: number;
  deadlineDate: string;
  addedMs: number;
  createdBy: string;
  updatedAt: string;
  isDone: boolean;
};
type DroppedProject = {
  _id: string;
  reason: string;
  projectId: string;
  createdAt: string;
};
type FinishedProject = {
  projectId: string;
  createdAt: "";
};
import { useEffect, useMemo, useOptimistic, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Upload,
  MoreVertical,
  CalendarDays,
  CheckCircle2,
  Plus,
  UserPlus,
  UserMinus,
  Clock,
  Folder,
  Cross,
} from "lucide-react";
import { useAllContexts } from "@/app/context/AllContext";
import { baseURL } from "@/app/utils/baseURL";
import { useParams, useRouter } from "next/navigation";
import { errorEmitter, successEmitter } from "@/app/utils/emitter";
import Loader from "@/app/loading";
import ProjectNotFound from "@/app/components/NoProject";
import { getRealDate } from "@/app/utils/DateFormat";
import MemberCard from "@/app/components/MemberCard";
import AddMemberModal from "@/app/components/AddMemberModal";
import { deadLineCalc } from "@/app/utils/DeadlineCalc";
import LeaveProjectModal from "@/app/components/LeaveProjectModal";
import EditDesignationModal from "@/app/components/EditDesignation";
import { timeCalc } from "@/app/utils/TimeCalculator";
import ButtonLoading from "@/app/components/ButtonLoading";
import ChatFloatingButton from "@/app/components/ChatFloatingButton";
import { clearAllProjects } from "@/app/utils/cacheclear/personalised/clearAllProjects";
import { clearProjectDetails } from "@/app/utils/cacheclear/shared/clearProjectDetails";
import { clearAllTasks } from "@/app/utils/cacheclear/shared/clearAllTasks";
import { clearAllNotifications } from "@/app/utils/cacheclear/personalised/clearNotifications";
import { checkLogin } from "@/app/utils/checkLogin";
import UnauthorizedAccessPage from "@/app/components/Unauthorized";

export default function ProjectDetailsPage() {
  const params = useParams();

  let {
    pageLoading,
    setPageLoading,
    leaveBtn,
    setLeaveBtn,
    setAllProjects,
    allProjects,
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
    prevProject,
    setprevProject,
    isLogin,
    setIsLogin,
  } = useAllContexts();

  const [droppedProjectState, setDroppedProjectState] =
    useState<DroppedProject>({
      _id: "",
      reason: "",
      projectId: "",
      createdAt: "",
    });
  const [finishedProjectState, setFinishedProjectState] =
    useState<FinishedProject>({
      projectId: "",
      createdAt: "",
    });
  const [uploadPending, setUploadPending] = useState<
    File[] | null | undefined
  >();
  const [uploadProjectImages, setUploadProjectImages] = useState<
    File[] | null | undefined
  >();
  const [selectMember, setSelectMember] = useState<User>();
  const [selectRemoveMember, setSelectRemoveMember] = useState<Members>();

  const [addMemberModal, setAddMemberModal] = useState<boolean>(false);
  const [finishTask, setFinishTask] = useState<boolean>(false);
  const [deleteTask, setDeleteTask] = useState<boolean>(false);
  const [editMemberModal, setEditMemberModal] = useState<boolean>(false);
  const [pendingBtn, setPendingBtn] = useState<boolean>(false);
  const [removeBtn, setRemoveBtn] = useState<boolean>(false);
  const [newAdminBtn, setNewAdminBtn] = useState<boolean>(false);
  const [noAdminBtn, setNoAdminBtn] = useState<boolean>(false);
  const [openLeaveModal, setOpenLeaveModal] = useState<boolean>(false);
  const [adminBtn, setAdminBtn] = useState<boolean>(false);
  const router = useRouter();

  const [updateMember, setUpdateMember] = useState<Members>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [selectedMember, setSelectedMember] = useState<string>(
    members.length > 0 ? members[0]._id : "",
  );
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [tasks, setTasks] = useState(allTasks);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [finishedTasks, setFinishedTasks] = useState(0);

  const [remainingTasks, setRemainingTasks] = useState(
    tasks.length > 0 ? tasks.length - finishedTasks : 0,
  );
  const [deadlineDate, setDeadlineDate] = useState("");
  const [reason, setReason] = useState<string>("Deadline Passed");
  const [designation, setDesignation] = useState<string>("");
  const [isDropModalOpen, setIsDropModalOpen] = useState<boolean>(false);
  const [daysUntilDeadline, setDaysUntilDeadline] = useState(0);
  const [vanishImg, setVanishImg] = useState<boolean>(false);
  const [markBtn, setMarkBtn] = useState<boolean>(false);
  const [approveBtn, setApproveBtn] = useState<boolean>(false);
  const [rejectBtn, setRejectBtn] = useState<boolean>(false);
  const [addTaskBtn, setAddTaskBtn] = useState<boolean>(false);
  const [currMember, setCurrMember] = useState<Members>({
    _id: "",
    user: {
      _id: "",
      email: "",
      name: "",
      profilepic: "",
      companyId: "",
      isManager: false,
      createdAt: "",
    },
    name: "",
    forProject: "",
    isAdmin: false,
    designation: "",
  });
  let { user, btnLoading, setBtnLoading } = useAllContexts();

  // Get Project API :
  const getProjectDetails = async () => {
    try {
      setPageLoading(true);
      setCalled(true);
      let response = await fetch(
        `${baseURL}/projects/projectdetails/${params.projectId}/${user.companyId._id}`,
      );
      let projectData = await response.json();
      // console.log(projectData);
      if (projectData.success) {
        setMembers(projectData.members);
        let tempMembers = projectData.members.filter(
          (elm: any) => elm.user._id == user._id,
        );
        if (tempMembers.length > 0) {
          setCurrMember(tempMembers[0]);
        }
        if (!projectData.members.includes(tempMembers[0])) {
          errorEmitter("Unauthorized access");
          return router.push("/");
        }
        setProject(projectData.project);
        setImages(projectData.images);
        //successEmitter(projectData.message);
        setAllMembers(projectData.allMembers);
        setDaysUntilDeadline(deadLineCalc(projectData.project.deadlineDate));
        setDeadlineDate(projectData.project.deadlineDate);
        setPendingImages(projectData.pendingImages);

        // console.log("Members : ", projectData.members);
        // console.log("All members : ", projectData.allMembers);
        if (projectData.project.isFailed) {
          let failedRes = await fetch(
            `${baseURL}/projects/dropproject/${projectData.project._id}`,
            {
              method: "GET",
            },
          );
          let dropData = await failedRes.json();
          //console.log(dropData);
          if (dropData.success) {
            setDroppedProjectState(dropData.droppedProject);
          } else errorEmitter(dropData.message);
        }
      } else errorEmitter(projectData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setPageLoading(false);
    }
  };
  // Get Tasks API :
  const getAllTasks = async () => {
    try {
      let taskResponse = await fetch(
        `${baseURL}/tasks/projects/${project._id}/${currMember._id}`,
        {
          method: "GET",
        },
      );
      let taskData = await taskResponse.json();
      //console.log(taskData);
      setAllTasks(taskData.tasks);
      setRemainingTasks(taskData.unFinishedTasks);
      setFinishedTasks(taskData.finishedTasks);
    } catch (error) {
      console.log(error);
    }
  };
  // Approve Image API :
  const approveImage = async (imageId: string, forUser: string) => {
    try {
      setApproveBtn(true);
      let response = await fetch(
        `${baseURL}/projects/pendingimages/${imageId}`,
        {
          method: "POST",
          body: JSON.stringify({
            forProject: project._id,
            forUser,
            byUser: user._id,
            addedMs: Date.now(),
            companyId: user.companyId._id,
          }),
        },
      );
      let approveData = await response.json();
      // console.log(approveData);
      if (approveData.success) {
        // successEmitter(approveData.message);
        setImages([...images, approveData.image]);
        setPendingImages(
          pendingImages.filter(
            (elm) => elm._id != approveData.deletePending._id,
          ),
        );
        setApproveBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        await clearAllNotifications(forUser);
      } else errorEmitter(approveData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setApproveBtn(false);
    }
  };
  // Disapprove Image API :
  const rejectImage = async (imageId: string, forUser: string) => {
    try {
      setRejectBtn(true);
      let response = await fetch(
        `${baseURL}/projects/pendingimages/${imageId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            forUser,
            byUser: user._id,
            addedMs: Date.now(),
            forProject: project._id,
            companyId: user.companyId._id,
          }),
        },
      );
      let approveData = await response.json();
      // console.log(approveData);
      if (approveData.success) {
        // successEmitter(approveData.message);
        setPendingImages(
          pendingImages.filter(
            (elm) => elm._id != approveData.deletePending._id,
          ),
        );
        setRejectBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        await clearAllNotifications(forUser);
      } else errorEmitter(approveData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setRejectBtn(false);
    }
  };

  // Drop Project API :
  const dropProject = async () => {
    try {
      setBtnLoading(true);
      let response = await fetch(
        `${baseURL}/projects/dropproject/${project._id}`,
        {
          method: "POST",
          body: JSON.stringify({
            reason,
            addedMs: Date.now(),
            byUser: user._id,
            companyId: user.companyId._id,
          }),
        },
      );
      let dropData = await response.json();
      // console.log(dropData);
      if (dropData.success) {
        successEmitter(dropData.message);
        setDroppedProjectState(dropData.droppedProject);
        setProject(dropData.updatedProject);
        setBtnLoading(false);
        allProjects.map((projectElm) => {
          if (projectElm.project._id == project._id) {
            projectElm.project.isFailed = true;
          }
          return projectElm;
        });
        await clearProjectDetails(project._id, user.companyId._id);
        await Promise.all(
          members.map(async (member) => {
            await clearAllNotifications(member.user._id);
            await clearAllProjects(member.user._id);
          }),
        );
      } else errorEmitter(dropData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };
  // Restart Project API :
  const restartProject = async () => {
    try {
      setBtnLoading(true);
      let response = await fetch(
        `${baseURL}/projects/dropproject/${project._id}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            byUser: user._id,
            addedMs: Date.now(),
            companyId: user.companyId._id,
          }),
        },
      );
      let restartData = await response.json();
      //console.log(restartData);
      if (restartData.success) {
        successEmitter(restartData.message);
        setProject(restartData.restartedProject);
        setDroppedProjectState({
          _id: "",
          reason: "",
          projectId: "",
          createdAt: "",
        });
        allProjects.map((projectElm) => {
          if (projectElm.project._id == project._id) {
            projectElm.project.isFailed = false;
          }
          return projectElm;
        });
        setBtnLoading(false);
        await Promise.all(
          members.map(async (member) => {
            await clearAllNotifications(member.user._id);
            await clearAllProjects(member.user._id);
          }),
        );
        await clearProjectDetails(project._id, user.companyId._id);
      } else errorEmitter(restartData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };
  //Remove Member API :
  const removeMember = async (memberId: string) => {
    try {
      setRemoveBtn(true);
      if (memberId == currMember._id) {
        setLeaveBtn(true);
      }
      let response = await fetch(
        `${baseURL}/members/${project._id}/members/${memberId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            byUser: user._id,
            companyId: user.companyId._id,
          }),
        },
      );
      let removedData = await response.json();
      // console.log(removedData);
      if (removedData.success) {
        // successEmitter(removedData.message);
        setAllProjects(
          allProjects.filter((proj) => proj.project._id != project._id),
        );
        if (removedData.code == 401) router.push("/");
        const userOfMember = members.find((member) => {
          if (member._id == memberId) return member.user;
        });
        setRemoveBtn(false);
        setLeaveBtn(false);
        await clearAllProjects(userOfMember?.user._id as string);
        await clearProjectDetails(project._id, user.companyId._id);
        await clearAllNotifications(userOfMember?.user._id as string);
        return true;
      } else {
        errorEmitter(removedData.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      setRemoveBtn(false);
      setLeaveBtn(false);
    }
  };
  // Make Admin API :
  const makeAdmin = async (memberId: string) => {
    try {
      setNewAdminBtn(true);
      let response = await fetch(
        `${baseURL}/members/${project._id}/members/${memberId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isAdmin: true,
            byUser: user._id,
          }),
        },
      );
      let adminData = await response.json();
      // console.log(adminData);
      if (adminData.success) {
        // successEmitter(adminData.message);
        setMembers(
          members.map((elm) => {
            if (elm._id == memberId) {
              elm.isAdmin = true;
            }
            return elm;
          }),
        );
        setNewAdminBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        const userOfMember = members.find((member) => {
          if (member._id == memberId) {
            return member.user;
          }
        });
        await clearAllNotifications(userOfMember?.user._id as string);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setNewAdminBtn(false);
    }
  };
  // Remove Admin API :
  const removeAdmin = async (memberId: string) => {
    try {
      setNoAdminBtn(true);
      let response = await fetch(
        `${baseURL}/members/${project._id}/members/${memberId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isAdmin: false,
            byUser: user._id,
            forProject: project._id,
            companyId: user.companyId._id,
          }),
        },
      );
      let adminData = await response.json();
      //console.log(adminData);
      if (adminData.success) {
        // successEmitter(adminData.message);
        setMembers(
          members.map((elm) => {
            if (elm._id == memberId) {
              elm.isAdmin = false;
            }
            return elm;
          }),
        );
        setNoAdminBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        const userOfMember = members.find((member) => {
          if (member._id == memberId) {
            return member.user;
          }
        });
        await clearAllNotifications(userOfMember?.user._id as string);
      } else errorEmitter(adminData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setNoAdminBtn(false);
    }
  };
  // Image delete API :
  const deleteImage = async (imageId: string) => {
    try {
      let response = await fetch(
        `${baseURL}/projects/projectimages/${imageId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            forProject: project._id,
            companyId: user.companyId._id,
          }),
        },
      );
      let deleteImgData = await response.json();
      // console.log(deleteImgData);
      if (deleteImgData.success) {
        // successEmitter(deleteImgData.message);
        await clearProjectDetails(project._id, user.companyId._id);
      } else errorEmitter(deleteImgData.message);
    } catch (error) {
      console.log(error);
    }
  };
  // Image upload API :
  // Members upload
  const uploadGeneralImages = async () => {
    try {
      setPendingBtn(true);
      //console.log(`Pending Btn now : `, pendingBtn);
      if (uploadPending) {
        if (uploadPending.length > 0) {
          await Promise.all(
            uploadPending.map(async (elm) => {
              let formData = new FormData();
              formData.append("image", elm);
              formData.append("user", user._id);
              formData.append("companyId", user.companyId._id);
              let response = await fetch(
                `${baseURL}/uploadmultiple/${project._id}`,
                {
                  method: "POST",
                  body: formData,
                },
              );
              let uploadData = await response.json();
              // console.log(uploadData);
              if (uploadData.success) {
                setPendingImages([...pendingImages, uploadData.newImgDoc]);
                setUploadPending([]);
                successEmitter("Image uploaded, waiting for approval");
                setPendingBtn(false);
                const allAdmins = members.map((member) => {
                  if (member.isAdmin) {
                    return member;
                  }
                });
                await clearProjectDetails(project._id, user.companyId._id);
                await Promise.all(
                  allAdmins.map(async (admin) => {
                    await clearAllNotifications(admin?.user._id as string);
                  }),
                );
              } else errorEmitter(uploadData.message);
              // console.log("Now pending images : ", pendingImages);
            }),
          );
        } else errorEmitter("Upload atleast 1 image to proceed");
      } else errorEmitter("No files uploaded");
    } catch (error) {
      console.log(error);
    } finally {
      setPendingBtn(false);
      //console.log(`Pending Btn finally : `, pendingBtn);
    }
  };
  // Admins upload
  const uploadProjectImagesFunc = async () => {
    if (currMember.isAdmin) {
      try {
        if (uploadProjectImages) {
          if (uploadProjectImages.length > 0) {
            setAdminBtn(true);
            await Promise.all(
              uploadProjectImages.map(async (elm) => {
                let formData = new FormData();
                formData.append("image", elm);
                formData.append("companyId", user.companyId._id);
                let response = await fetch(
                  `${baseURL}/uploadmultiple/${project._id}`,
                  {
                    method: "PUT",
                    body: formData,
                  },
                );
                let uploadData = await response.json();
                // console.log(uploadData);
                if (uploadData.success) {
                  // console.log("Setting images");
                  setImages([...images, uploadData.newImgDoc]);
                  //  successEmitter(uploadData.message);

                  setAdminBtn(false);
                  await clearProjectDetails(project._id, user.companyId._id);
                } else errorEmitter(uploadData.message);
                // console.log(uploadData);
              }),
            );
          } else errorEmitter("Upload atleast 1 image to proceed");
        } else errorEmitter("No files upload");
      } catch (error) {
        console.log(error);
      } finally {
        setAdminBtn(false);
      }
    } else errorEmitter("Only admin can upload project images directly");
  };
  // Finish Project API :
  const finishProject = async () => {
    try {
      setMarkBtn(true);
      let response = await fetch(
        `${baseURL}/projects/finishproject/${project._id}`,
        {
          method: "POST",
          body: JSON.stringify({
            byUser: user._id,
            addedMs: Date.now(),
            companyId: user.companyId._id,
          }),
        },
      );
      let finishData = await response.json();
      // console.log("Finish Data : ", finishData);
      if (finishData.success) {
        setFinishedProjectState(finishData.finishedProject);
        setProject(finishData.updatedProject);
        allProjects.map((projectElm) => {
          if (projectElm.project._id == project._id) {
            projectElm.project.isDone = true;
          }
          return projectElm;
        });
        setMarkBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        await Promise.all(
          members.map(async (member) => {
            await clearAllProjects(member.user._id);
            await clearAllNotifications(member.user._id);
          }),
        );
      } else errorEmitter(finishData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setMarkBtn(false);
    }
  };
  // Incomplete Project API :
  const unFinishProject = async () => {
    try {
      setMarkBtn(true);
      let response = await fetch(
        `${baseURL}/projects/finishproject/${project._id}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            byUser: user._id,
            addedMs: Date.now(),
            companyId: user.companyId._id,
          }),
        },
      );
      let finishData = await response.json();
      // console.log(finishData);
      if (finishData.success) {
        setFinishedProjectState({ projectId: "", createdAt: "" });
        setProject(finishData.updatedProject);

        allProjects.map((projectElm) => {
          if (projectElm.project._id == project._id) {
            projectElm.project.isDone = false;
          }
          return projectElm;
        });
        setMarkBtn(false);
        await clearProjectDetails(project._id, user.companyId._id);
        await Promise.all(
          members.map(async (member) => {
            await clearAllProjects(member.user._id);
            await clearAllNotifications(member.user._id);
          }),
        );
      } else errorEmitter(finishData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setMarkBtn(false);
    }
  };
  // Get finished project API :
  const getFinishProject = async () => {
    try {
      let response = await fetch(
        `${baseURL}/projects/finishproject/${project._id}`,
        {
          method: "GET",
        },
      );
      let finishData = await response.json();
      // console.log(finishData);
      if (finishData.success) {
        // successEmitter(finishData.message);
        setFinishedDate(finishData.project.createdAt);
      } else errorEmitter(finishData.message);
    } catch (error) {
      console.log(error);
    }
  };
  // Add Task API :
  const addTask = async (memberId: string, userId: string) => {
    try {
      setAddTaskBtn(true);
      let response = await fetch(`${baseURL}/tasks/${memberId}`, {
        method: "POST",
        body: JSON.stringify({
          byUser: user._id,
          task: taskTitle,
          assignedBy: currMember._id,
          forProject: project._id,
          forUser: userId,
        }),
      });
      let taskData = await response.json();
      // console.log(taskData);
      if (taskData.success) {
        // successEmitter(taskData.message);
        setAllTasks([
          ...allTasks,
          {
            assignedTo: taskData.assignedTo,
            assignedBy: taskData.assignedBy,
            _doc: taskData.newTask,
          },
        ]);
        setTaskTitle("");
        setAddTaskBtn(false);
        await clearAllTasks(project._id);
        await clearAllNotifications(userId);
      } else errorEmitter(taskData.message);
    } catch (error) {
      console.log(error);
    } finally {
      setAddTaskBtn(false);
    }
  };
  // Complete Task :
  const completeTask = async (
    taskId: string,
    assignedBy: string,
  ): Promise<boolean> => {
    try {
      setFinishTask(true);
      let response = await fetch(`${baseURL}/tasks/task/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          byUser: user._id,
          forUser: assignedBy,
          forProject: project._id,
        }),
      });
      let doneData = await response.json();
      // console.log(doneData);
      if (doneData.success) {
        // successEmitter(doneData.message);
        setFinishTask(false);
        await clearAllTasks(project._id);
        await clearAllNotifications(assignedBy);
        return true;
      } else {
        errorEmitter(doneData.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      setFinishTask(false);
    }
  };
  // Delete Task :
  const deleteTaskFunc = async (taslId: string): Promise<boolean> => {
    try {
      setDeleteTask(true);
      let response = await fetch(`${baseURL}/tasks/task/${taslId}`, {
        method: "DELETE",
      });
      let deleteData = await response.json();
      //console.log(deleteData);
      if (deleteData.success) {
        // successEmitter(deleteData.message);
        setDeleteTask(false);
        await clearAllTasks(project._id);
        return true;
      } else {
        errorEmitter(deleteData.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      setDeleteTask(false);
    }
  };

  useEffect(() => {
    let fetchProjectDetails = async () => {
      await getProjectDetails();
    };
    setPageLoading(true);
    setTimeout(() => {
      setPageLoading(false);
    }, 600);
    if (
      project._id.length == 0 ||
      images.length == 0 ||
      members.length == 0 ||
      allMembers.length == 0 ||
      (pendingImages.length == 0 && !called) ||
      project._id != params.projectId ||
      allTasks.length == 0
    ) {
      fetchProjectDetails();
      setprevProject(params.projectId as string);
    }

    setDaysUntilDeadline(deadLineCalc(project.deadlineDate));
    setDeadlineDate(project.deadlineDate);
  }, []);
  useEffect(() => {
    if (project && currMember._id) {
      getAllTasks();
    }
  }, [currMember._id, project]);
  useEffect(() => {
    if (members.length > 0) {
      setSelectedMember(members[0]._id);
    }
  }, [members]);
  useEffect(() => {
    if (images.length <= currentImageIndex) {
      setCurrentImageIndex(Math.max(0, images.length - 1));
    }
  }, [images, currentImageIndex]);
  useEffect(() => {
    let tempMembers = members.filter((elm) => elm.user._id == user._id);
    if (tempMembers.length > 0) {
      setCurrMember(tempMembers[0]);
    }
    // console.log("Current Member : ", currMember);
  }, [members]);
  useEffect(() => {
    if (deadLineCalc(project.deadlineDate) <= 0 && project._id) {
      // console.log(
      //   `Dropping Project because project deadline is :${project.deadlineDate} and deadLineCalc is : ${deadLineCalc(project.deadlineDate)}`,
      // );
      dropProject();
    }
  }, [deadLineCalc(project.deadlineDate)]);
  let unFinishedTasks = useMemo(() => {
    let count = 0;
    allTasks.map((elm) => {
      if (!elm._doc.isDone) {
        count++;
      }
    });
    return count;
  }, [allTasks]);
  let finishedTasksCount = useMemo(() => {
    let count = 0;
    allTasks.map((elm) => {
      if (elm._doc.isDone) {
        count++;
      }
    });
    return count;
  }, [allTasks]);
  useEffect(() => {
    setFinishedTasks(finishedTasksCount || 0);
    setRemainingTasks(unFinishedTasks || 0);
  }, [allTasks]);
  useEffect(() => {
    if (project.isDone) {
      const fetchFinishProject = async () => {
        await getFinishProject();
      };
      fetchFinishProject();
    }
  }, [project.isDone]);

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
      {pageLoading ? (
        <Loader />
      ) : (
        <>
          {!project ? (
            <ProjectNotFound />
          ) : !isLogin ? (
            <UnauthorizedAccessPage />
          ) : (
            <>
              <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 dark:from-black dark:via-slate-950 dark:to-black px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="space-y-6">
                      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="relative h-72 md:h-80 overflow-hidden rounded-3xl">
                          {images.length > 0 ? (
                            <div
                              className="flex h-full transition-transform duration-300 ease-in-out"
                              style={{
                                transform: `translateX(-${currentImageIndex * 100}%)`,
                              }}
                            >
                              {images.map((elm, idx) => (
                                <div
                                  key={`${elm.url}-${idx}`}
                                  className="group relative shrink-0 h-full w-full"
                                >
                                  <a
                                    href={elm.url}
                                    target="_blank"
                                    className="block h-full w-full"
                                  >
                                    <img
                                      src={elm.url}
                                      alt="Project hero"
                                      className="h-full w-full object-cover"
                                    />
                                  </a>

                                  {currMember.isAdmin && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await deleteImage(elm._id);
                                        setImages(
                                          images.filter(
                                            (elm2) => elm2._id != elm._id,
                                          ),
                                        );
                                      }}
                                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full  text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-red-600 bg-indigo-600/40 hover:text-white dark:hover:bg-red-600"
                                      aria-label="Delete image"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <img
                              src="https://i.pinimg.com/originals/00/d6/a4/00d6a44aac5ae4e947909ab9db888f32.gif"
                              alt="Project hero"
                              className="w-full h-full object-cover"
                            />
                          )}

                          <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-slate-100 transition text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                Math.max(0, prev - 1),
                              )
                            }
                            disabled={
                              currentImageIndex === 0 || images.length <= 1
                            }
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-slate-100 text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                Math.min(images.length - 1, prev + 1),
                              )
                            }
                            disabled={
                              currentImageIndex >= images.length - 1 ||
                              images.length <= 1
                            }
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 space-y-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                                {project.title ? (
                                  project.title
                                ) : (
                                  <>
                                    <div className="flex w-auto justify-center items-center gap-2">
                                      Loading Title, Please wait...{" "}
                                      <ButtonLoading />
                                    </div>
                                  </>
                                )}
                              </h1>
                              <div className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                                {project.description ? (
                                  project.description
                                ) : (
                                  <div className="flex justify-center items-center w-auto gap-2">
                                    Loading Description, Please wait...{" "}
                                    <ButtonLoading />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {!project.isFailed && !project.isDone && (
                                <button
                                  title={`${currMember.isAdmin ? "Edit Project" : "Only Admin can perform this action"}`}
                                  disabled={!currMember.isAdmin}
                                  onClick={() =>
                                    router.push(
                                      `/editproject/${project._id}/${currMember._id}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Pencil className="w-4 h-4 text-blue-600" />
                                  Edit Project
                                </button>
                              )}
                              {!project.isFailed && !project.isDone && (
                                <button
                                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md dark:hover:bg-indigo-500"
                                  onClick={() => setIsImageModalOpen(true)}
                                >
                                  <Upload className="w-4 h-4" />
                                  View uploaded images
                                </button>
                              )}
                              {!project.isFailed ? (
                                <>
                                  {!project.isDone && (
                                    <button
                                      title={`${currMember.isAdmin ? "Drop Project" : "Only Admin can perform this action"}`}
                                      disabled={!currMember.isAdmin}
                                      onClick={async () => {
                                        setIsDropModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Drop Project
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  disabled={btnLoading || !currMember.isAdmin}
                                  title={`${currMember.isAdmin ? "Restart Project" : "Only Admin can perform this action"}`}
                                  onClick={async () => {
                                    await restartProject();
                                    setProject({ ...project, isFailed: false });
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                                >
                                  <Folder className="w-4 h-4" />
                                  {btnLoading ? (
                                    <>
                                      <div className="flex justify-center items-center gap-2">
                                        Restarting Project{" "}
                                        <ButtonLoading />{" "}
                                      </div>
                                    </>
                                  ) : (
                                    "Restart Project"
                                  )}
                                </button>
                              )}
                              {!project.isFailed && (
                                <>
                                  {project.isDone ? (
                                    <button
                                      disabled={markBtn || !currMember.isAdmin}
                                      title={`${currMember.isAdmin ? "Restart Project" : "Only Admin can perform this action"}`}
                                      onClick={async () => {
                                        await unFinishProject();
                                        setProject({
                                          ...project,
                                          isDone: false,
                                        });
                                      }}
                                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      <Cross className="w-4 text-green-500 h-4" />
                                      {markBtn ? (
                                        <>
                                          <div className="flex justify-center items-center gap-2">
                                            Restarting Project{" "}
                                            <ButtonLoading />{" "}
                                          </div>
                                        </>
                                      ) : (
                                        "Restart Project"
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      disabled={markBtn || !currMember.isAdmin}
                                      title={`${currMember.isAdmin ? "Mark as complete" : "Only Admin can perform this action"}`}
                                      onClick={async () => {
                                        await finishProject();
                                        setProject({
                                          ...project,
                                          isDone: true,
                                        });
                                      }}
                                      className="inline-flex items-center  gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900  dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      {markBtn ? (
                                        <>
                                          <div className="flex justify-center items-center gap-2">
                                            Marking as complete{" "}
                                            <ButtonLoading />{" "}
                                          </div>
                                        </>
                                      ) : (
                                        "Mark as complete"
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {!project.isFailed && !project.isDone && (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="flex flex-col gap-2 rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    Upload images (everyone)
                                  </span>
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        setUploadPending(
                                          Array.from(e.target.files),
                                        );
                                        e.target.files = null;
                                      }
                                    }}
                                    className="mt-2 w-full text-sm text-slate-600 dark:text-slate-300"
                                  />
                                  <button
                                    type="button"
                                    disabled={pendingBtn}
                                    onClick={async () => {
                                      // console.log("General button clicked");
                                      await uploadGeneralImages();
                                    }}
                                    className="mt-2 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:hover:bg-indigo-700"
                                  >
                                    {pendingBtn ? (
                                      <>
                                        <div className="flex justify-center items-center gap-2">
                                          Uploading Images{" "}
                                          <ButtonLoading />{" "}
                                        </div>
                                      </>
                                    ) : (
                                      "Upload Images"
                                    )}
                                  </button>
                                </label>

                                <label className="flex flex-col gap-2 rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    Upload images (Admins only)
                                  </span>
                                  <input
                                    type="file"
                                    disabled={!currMember.isAdmin}
                                    title={`${currMember.isAdmin ? "Upload images directly to project without approval" : "Only Admin can perform this action"}`}
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        setUploadProjectImages(
                                          Array.from(e.target.files),
                                        );
                                        e.target.files = null;
                                      }
                                    }}
                                    className="mt-2 w-full text-sm text-slate-600 dark:text-slate-300"
                                  />
                                  <button
                                    type="button"
                                    disabled={adminBtn || !currMember.isAdmin}
                                    title={`${currMember.isAdmin ? "Upload images directly to project without approval" : "Only Admin can perform this action"}`}
                                    onClick={async () => {
                                      // console.log("Admin button clicked");
                                      await uploadProjectImagesFunc();
                                    }}
                                    className="mt-2 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:hover:bg-indigo-700"
                                  >
                                    {adminBtn ? (
                                      <>
                                        <div className="flex justify-center items-center gap-2">
                                          Uploading Images{" "}
                                          <ButtonLoading />{" "}
                                        </div>
                                      </>
                                    ) : (
                                      "Upload Images"
                                    )}
                                  </button>
                                </label>
                              </div>
                            </div>
                          )}

                          {!project.isFailed && !project.isDone && (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                  <CalendarDays className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    Deadline
                                  </span>
                                </div>
                                <p className="mt-4 text-xl  font-semibold text-slate-900 dark:text-white">
                                  {deadlineDate ? (
                                    getRealDate(deadlineDate)
                                  ) : (
                                    <div className="flex justify-center items-center gap-2">
                                      Loading deadline <ButtonLoading />{" "}
                                    </div>
                                  )}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                  In{" "}
                                  {called ? (
                                    daysUntilDeadline
                                  ) : (
                                    <>
                                      <div className="flex justify-center items-center gap-2">
                                        <ButtonLoading />{" "}
                                      </div>
                                    </>
                                  )}{" "}
                                  days
                                </p>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                  <Clock className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    Deadline approaching
                                  </span>
                                </div>
                                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                                  {daysUntilDeadline} days
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                  Keep the team aligned.
                                </p>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    Finished tasks
                                  </span>
                                </div>
                                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                                  {finishedTasks}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                  Tasks completed so far.
                                </p>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                  <UserMinus className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    Remaining tasks
                                  </span>
                                </div>
                                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                                  {remainingTasks}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                  Tasks still in progress.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {!project.isFailed && !project.isDone && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Tasks
                              </h2>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Manage project work and progress.
                              </p>
                            </div>

                            <button
                              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md dark:hover:bg-indigo-500"
                              onClick={() => setIsModalOpen(true)}
                            >
                              <Plus className="w-4 h-4" />
                              Add task
                            </button>
                          </div>

                          {allTasks.length > 0 ? (
                            <div className="mt-6 space-y-3">
                              {allTasks.map((task: any, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                >
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        {task._doc.task}
                                      </p>

                                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Assigned by {task.assignedBy.user.name}{" "}
                                        to {task.assignedTo.user.name}
                                      </p>

                                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                        Added {timeCalc(task._doc.addedAt)}
                                      </p>
                                    </div>

                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                      <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                          task._doc.isDone
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        }`}
                                      >
                                        {task._doc.isDone
                                          ? "Completed"
                                          : "In progress"}
                                      </span>

                                      <div className="flex flex-wrap gap-2">
                                        {!task._doc.isDone &&
                                          task.assignedTo._id ==
                                            currMember._id && (
                                            <button
                                              disabled={finishTask}
                                              onClick={async () => {
                                                let result = await completeTask(
                                                  task._doc._id,
                                                  task._doc.assignedBy.user,
                                                );
                                                if (result) {
                                                  // console.log(task._doc.isDone);
                                                  setAllTasks(
                                                    allTasks.map(
                                                      (taskInArr: any) => {
                                                        if (
                                                          taskInArr._doc._id ==
                                                          task._doc._id
                                                        ) {
                                                          taskInArr._doc.isDone = true;
                                                        }
                                                        return taskInArr;
                                                      },
                                                    ),
                                                  );
                                                }
                                              }}
                                              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                                              {finishTask ? (
                                                <>
                                                  <div className="flex justify-center items-center gap-2">
                                                    Marking as complete{" "}
                                                    <ButtonLoading />{" "}
                                                  </div>
                                                </>
                                              ) : (
                                                "Mark as complete"
                                              )}
                                            </button>
                                          )}

                                        {(currMember.isAdmin ||
                                          task.assignedBy._id ==
                                            currMember._id) && (
                                          <button
                                            disabled={deleteTask}
                                            onClick={async () => {
                                              let result = await deleteTaskFunc(
                                                task._doc._id,
                                              );
                                              if (result) {
                                                setAllTasks(
                                                  allTasks.filter(
                                                    (taskInArr: any) =>
                                                      taskInArr._doc._id !=
                                                      task._doc._id,
                                                  ),
                                                );
                                              }
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            {deleteTask ? (
                                              <>
                                                <div className="flex justify-center items-center gap-2">
                                                  Deleting Task{" "}
                                                  <ButtonLoading />{" "}
                                                </div>
                                              </>
                                            ) : (
                                              "Delete Task"
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full flex justify-center">
                              <h2 className="dark:text-white text-slate-900">
                                No Tasks assigned yet
                              </h2>
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    <aside className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                              Team members
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Click the menu icon for member actions.
                            </p>
                          </div>
                          {currMember.isAdmin &&
                            !project.isFailed &&
                            !project.isDone && (
                              <details className="relative">
                                <summary className="inline-flex list-none cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                                  <UserPlus className="w-4 h-4" />
                                  Add member
                                </summary>

                                <div className="absolute right-0 top-14 z-20 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      Select a member
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Choose from your company members
                                    </p>
                                  </div>

                                  <div className="max-h-72 space-y-2 overflow-auto p-3">
                                    {allMembers.length > 0 ? (
                                      allMembers.map((member, idx) => {
                                        if (member) {
                                          if (
                                            member?._id != currMember.user._id
                                          ) {
                                            return (
                                              <MemberCard
                                                key={idx}
                                                setSelectMember={
                                                  setSelectMember
                                                }
                                                setAddMemberModal={
                                                  setAddMemberModal
                                                }
                                                member={member}
                                              />
                                            );
                                          }
                                        }
                                      })
                                    ) : (
                                      <div className="rounded-2xl px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No members available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </details>
                            )}
                        </div>
                        {
                          <div className="mt-5 space-y-3">
                            {members.length > 0
                              ? members.map((member, index) => (
                                  <div
                                    key={member._id}
                                    className="group relative rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={(member.user as any).profilepic}
                                        alt={(member.user as any).name}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                            {(member.user as any).name}
                                          </p>
                                          {member.isAdmin && (
                                            <span className="text-[10px] rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                              Admin
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {member.designation}
                                        </p>
                                      </div>

                                      {(currMember.isAdmin ||
                                        currMember._id == member._id) && (
                                        <button
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                          onClick={() =>
                                            setOpenMenu(
                                              openMenu === index ? null : index,
                                            )
                                          }
                                          aria-label="Open member actions"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>

                                    {openMenu === index && (
                                      <div className="absolute right-4 top-16 z-10 w-55 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                        {currMember.isAdmin &&
                                          !member.isAdmin && (
                                            <button
                                              disabled={newAdminBtn}
                                              onClick={async () => {
                                                await makeAdmin(member._id);
                                                setOpenMenu(
                                                  openMenu === index
                                                    ? null
                                                    : index,
                                                );
                                              }}
                                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                              {newAdminBtn ? (
                                                <>
                                                  <div className="flex justify-center items-center gap-2">
                                                    Making Admin{" "}
                                                    <ButtonLoading />{" "}
                                                  </div>
                                                </>
                                              ) : (
                                                "Make admin"
                                              )}
                                            </button>
                                          )}
                                        {member.isAdmin && (
                                          <button
                                            disabled={noAdminBtn}
                                            onClick={async () => {
                                              await removeAdmin(member._id);
                                              setOpenMenu(
                                                openMenu === index
                                                  ? null
                                                  : index,
                                              );
                                            }}
                                            className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                          >
                                            {noAdminBtn ? (
                                              <>
                                                <div className="flex justify-center items-center gap-2">
                                                  Removing as admin{" "}
                                                  <ButtonLoading />{" "}
                                                </div>
                                              </>
                                            ) : (
                                              "Remove as admin"
                                            )}
                                          </button>
                                        )}
                                        {currMember.isAdmin && (
                                          <button
                                            disabled={noAdminBtn}
                                            onClick={async () => {
                                              setUpdateMember(member);
                                              setEditMemberModal(true);
                                              setOpenMenu(
                                                openMenu === index
                                                  ? null
                                                  : index,
                                              );
                                            }}
                                            className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                          >
                                            Change Designation
                                          </button>
                                        )}
                                        {member.user._id != user._id && (
                                          <button
                                            disabled={removeBtn}
                                            onClick={async () => {
                                              let result = await removeMember(
                                                member._id,
                                              );
                                              if (result) {
                                                setMembers(
                                                  members.filter(
                                                    (elm) =>
                                                      elm._id != member._id,
                                                  ),
                                                );
                                                let removedRes = await fetch(
                                                  `${baseURL}/users/${member.user._id}`,
                                                );
                                                let removedUserData =
                                                  await removedRes.json();
                                                // console.log(removedUserData);
                                                let removedUser =
                                                  removedUserData.user;
                                                setAllMembers([
                                                  ...allMembers,
                                                  removedUser,
                                                ]);
                                              }

                                              setOpenMenu(
                                                openMenu === index
                                                  ? null
                                                  : index,
                                              );
                                            }}
                                            className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                                          >
                                            {removeBtn ? (
                                              <>
                                                <div className="flex justify-center items-center gap-2">
                                                  Removing Member{" "}
                                                  <ButtonLoading />{" "}
                                                </div>
                                              </>
                                            ) : (
                                              "Remove member"
                                            )}
                                          </button>
                                        )}
                                        {member.user._id == user._id && (
                                          <button
                                            onClick={async () => {
                                              let result = false;
                                              let adminArr = members.filter(
                                                (elm) => elm.isAdmin,
                                              );
                                              let adminCount = adminArr.length;
                                              if (
                                                adminCount <= 1 &&
                                                currMember.isAdmin
                                              ) {
                                                setSelectRemoveMember(member);
                                                setOpenLeaveModal(true);
                                              } else {
                                                result = await removeMember(
                                                  member._id,
                                                );
                                                !openLeaveModal &&
                                                  result &&
                                                  setMembers(
                                                    members.filter(
                                                      (elm) =>
                                                        elm._id != member._id,
                                                    ),
                                                  );
                                              }
                                              setOpenMenu(
                                                openMenu === index
                                                  ? null
                                                  : index,
                                              );
                                              result && router.push("/");
                                            }}
                                            className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                                          >
                                            {leaveBtn
                                              ? "Leaving Project.."
                                              : "Leave Project"}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              : ""}
                          </div>
                        }
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Project details
                        </h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                          {!project.isFailed ? (
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                              <span>Members</span>
                              <strong className="text-slate-900 dark:text-white">
                                {members.length}
                              </strong>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                              <span>Reason for failure</span>
                              <strong className="text-slate-900 dark:text-white">
                                {droppedProjectState.reason}
                              </strong>
                            </div>
                          )}
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                            {!project.isFailed ? (
                              <>
                                {project.isDone ? (
                                  <>
                                    <span>Completed At</span>
                                    <strong className="text-slate-900 dark:text-white">
                                      {getRealDate(finishedDate)}
                                    </strong>
                                  </>
                                ) : (
                                  <>
                                    <span>Deadline approaching</span>
                                    <strong className="text-slate-900 dark:text-white">
                                      {daysUntilDeadline} days
                                    </strong>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <span>Dropped at</span>
                                <strong className="text-slate-900 dark:text-white">
                                  {getRealDate(droppedProjectState.createdAt)}
                                </strong>
                              </>
                            )}
                          </div>
                          {!project.isFailed && !project.isDone && (
                            <>
                              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                                <span>Remaining tasks</span>
                                <strong className="text-slate-900 dark:text-white">
                                  {remainingTasks}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                                <span>Finished tasks</span>
                                <strong className="text-slate-900 dark:text-white">
                                  {finishedTasks}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
                {addMemberModal && (
                  <AddMemberModal
                    setAddMemberModal={setAddMemberModal}
                    setMembers={setMembers}
                    allMembers={members}
                    selectMember={selectMember}
                    allCompanyMembers={allMembers}
                    setAllMembers={setAllMembers}
                    projectId={project._id}
                  />
                )}
                {editMemberModal && (
                  <EditDesignationModal
                    updateMember={updateMember}
                    setUpdateMember={setUpdateMember}
                    members={members}
                    setEditMemberModal={setEditMemberModal}
                    editMemberModal={editMemberModal}
                    designation={designation}
                    setDesignation={setDesignation}
                  />
                )}
                {openLeaveModal && (
                  <LeaveProjectModal
                    setMembers={setMembers}
                    setSelectRemoveMember={setSelectRemoveMember}
                    members={members}
                    selectRemoveMember={selectRemoveMember}
                    removeMember={removeMember}
                    openLeaveModal={openLeaveModal}
                    setOpenLeaveModal={setOpenLeaveModal}
                  />
                )}
                {isDropModalOpen && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                    action=""
                  >
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-5">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Drop Project
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Please mention the reason for dropping this project.
                          </p>
                        </div>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Reason
                          </span>
                          <textarea
                            rows={5}
                            value={reason}
                            onChange={(e) => {
                              setReason(e.target.value);
                            }}
                            required
                            placeholder="Write the reason here..."
                            className="mt-2 w-full resize-none rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                          />
                        </label>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            disabled={btnLoading}
                            type="button"
                            onClick={() => setIsDropModalOpen(false)}
                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={btnLoading}
                            type="submit"
                            onClick={async () => {
                              await dropProject();
                              setIsDropModalOpen(false);
                              setProject({ ...project, isFailed: true });
                            }}
                            className="rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            {btnLoading ? (
                              <>
                                <div className="flex justify-center items-center gap-2">
                                  Dropping Project <ButtonLoading />{" "}
                                </div>
                              </>
                            ) : (
                              "Drop Project"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
                {isModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Add Task
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Enter a task name and select a team member.
                          </p>
                        </div>
                        <button
                          className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="mt-6 space-y-5">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Task Name
                          </span>
                          <input
                            value={taskTitle}
                            onChange={(event) =>
                              setTaskTitle(event.target.value)
                            }
                            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                            placeholder="Type a task title"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Assign to
                          </span>
                          <select
                            value={selectedMember}
                            onChange={(event) =>
                              setSelectedMember(event.target.value)
                            }
                            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                          >
                            {members.length > 0 ? (
                              members.map((member) => (
                                <option
                                  key={member.user._id}
                                  value={member._id}
                                >
                                  {member.user.name}
                                </option>
                              ))
                            ) : (
                              <option>None</option>
                            )}
                          </select>
                        </label>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            onClick={() => setIsModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            disabled={addTaskBtn}
                            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md dark:hover:bg-indigo-500"
                            onClick={async () => {
                              const userOfMember = members.find(
                                (elm) => elm._id == selectedMember,
                              );
                              // console.log("User of member : ", userOfMember);
                              // console.log("Selected Member : ", selectedMember);
                              if (userOfMember?.user) {
                                await addTask(
                                  selectedMember,
                                  userOfMember.user._id,
                                );
                              }
                              setIsModalOpen(false);
                            }}
                          >
                            {addTaskBtn ? (
                              <>
                                <div className="flex justify-center items-center gap-2">
                                  Adding Task <ButtonLoading />{" "}
                                </div>
                              </>
                            ) : (
                              "Add Task"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <ChatFloatingButton projectId={project._id} />
                {isImageModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                    <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Uploaded Images
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Review uploaded images and approve or delete them.
                          </p>
                        </div>
                        <button
                          className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          onClick={() => setIsImageModalOpen(false)}
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {pendingImages.length ? (
                          pendingImages.map((upload) => (
                            <>
                              <div
                                key={upload._id}
                                className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-950"
                              >
                                <div className="relative">
                                  <a href={upload.url}>
                                    <img
                                      src={upload.url}
                                      alt={upload.byUser.name}
                                      className="h-64 w-full object-cover"
                                    />
                                  </a>
                                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />
                                  {currMember.isAdmin ||
                                  currMember.user._id == upload.byUser._id ? (
                                    <div className="absolute inset-x-0 left-30 bottom-0 p-4 text-white opacity-0 transition group-hover:opacity-100">
                                      <p className="text-sm font-semibold">
                                        Uploaded by
                                      </p>
                                      <p className="text-sm">
                                        {upload.byUser.name}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 left-30 bottom-0 p-1 text-slate-100 opacity-0 transition group-hover:opacity-100">
                                      <p className="text-sm font-semibold">
                                        Uploaded by
                                      </p>
                                      <p className="text-sm text-slate-50">
                                        {upload.byUser.name}
                                      </p>
                                    </div>
                                  )}

                                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/70 px-4 py-3 opacity-0 transition group-hover:opacity-100">
                                    <>
                                      {currMember.isAdmin && (
                                        <button
                                          disabled={approveBtn}
                                          onClick={async () => {
                                            await approveImage(
                                              upload._id,
                                              upload.byUser._id,
                                            );
                                          }}
                                          className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
                                        >
                                          {approveBtn ? (
                                            <>
                                              <div className="flex justify-center items-center gap-2">
                                                Approving <ButtonLoading />{" "}
                                              </div>
                                            </>
                                          ) : (
                                            "Approve"
                                          )}
                                        </button>
                                      )}
                                      {currMember.user._id ==
                                        upload.byUser._id ||
                                      currMember.isAdmin ? (
                                        <button
                                          disabled={rejectBtn}
                                          onClick={async () => {
                                            await rejectImage(
                                              upload._id,
                                              upload.byUser._id,
                                            );
                                          }}
                                          className="rounded-full bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400"
                                        >
                                          {rejectBtn ? (
                                            <>
                                              <div className="flex justify-center items-center gap-2">
                                                Deleting <ButtonLoading />{" "}
                                              </div>
                                            </>
                                          ) : (
                                            "Delete"
                                          )}
                                        </button>
                                      ) : (
                                        ""
                                      )}
                                    </>
                                  </div>
                                </div>
                              </div>
                            </>
                          ))
                        ) : (
                          <h2 className="dark:text-white text-slate-900">
                            No Pending Images
                          </h2>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
