import memberModel from "@/app/models/member.model";
import notificationModel from "@/app/models/notification.model";
import projectModel from "@/app/models/project.model";
import taskModel from "@/app/models/task.model";
import userModel from "@/app/models/user.model";
import { clearAllProjects } from "@/app/utils/cacheclear/personalised/clearAllProjects";
import { clearAllTasks } from "@/app/utils/cacheclear/shared/clearAllTasks";
import { clearProjectDetails } from "@/app/utils/cacheclear/shared/clearProjectDetails";
import { getRealDate } from "@/app/utils/DateFormat";
import { deadLineCalc } from "@/app/utils/DeadlineCalc";
type Parameter = {
  projectKeyword: string;
  taskKeyword: string;
  userKeyword: string;
  newProjectData: string;
};
type CleanProject = {
  title: string;
  description: string;
  deadline: string;
  daysRemaining: number;
  completed: boolean;
  isFailed: boolean;
};
type CleanTask = {
  task: string;
  projectTitle: string;
  projectDeadine: string;
  completed: boolean;
};
type CleanAssignedTask = {
  task: string;
  projectTitle: string;
  projectDeadine: string;
  completed: boolean;
  assignedTo: string;
};
type CleanProfile = {
  name: string;
  companyName: string;
  isUserManager: boolean;
};
type CleanNotification = {
  byUser: string;
  forProject: string;
  about: string;
};

export const getProjects = async (userId: string) => {
  try {
    let allMyrojects: any[] = await memberModel
      .find({ user: userId })
      .populate("forProject")
      .select("user");
    let cleanProjects: CleanProject[] = [];
    if (allMyrojects) {
      cleanProjects = allMyrojects.map((member) => {
        return {
          title: member.forProject.title as string,
          description: (member.forProject.description.toString().slice(0, 30) +
            "...") as string,
          deadline: getRealDate(member.forProject.deadline) as string,
          completed: member.forProject.isDone as boolean,
          daysRemaining: deadLineCalc(member.forProject.deadlineDate) as number,
          isFailed: member.forProject.isFailed,
        };
      });
    }
    return cleanProjects;
  } catch (error) {
    console.log(error);
  }
};

export const getPendingTasks = async (userId: string) => {
  try {
    let whereIamMember = await memberModel.find({ user: userId });

    let allPendingTasks: any = [];
    let cleanPendingTasks: CleanTask[] = [];
    await Promise.allSettled(
      whereIamMember.map(async (member) => {
        let pendingTasksForThisProject = await taskModel
          .find({
            assignedTo: member._id,
            isDone: false,
          })
          .select("forProject isDone task")
          .populate("forProject");
        allPendingTasks.push(...pendingTasksForThisProject);
      }),
    );
    cleanPendingTasks = allPendingTasks.map((pendingTask: any) => {
      return {
        task: pendingTask.task as string,
        projectTitle: pendingTask.forProject.title as string,
        projectDeadine: getRealDate(
          pendingTask.forProject.deadlineDate,
        ) as string,
        completed: pendingTask.isDone as boolean,
      };
    });
    return cleanPendingTasks;
  } catch (error) {
    console.log(error);
  }
};

export const getCompletedTasks = async (userId: string) => {
  try {
    let whereIamMember = await memberModel
      .find({ user: userId })
      .populate("forProject")
      .select("user");
    let allCompletedTasks: any = [];
    await Promise.allSettled(
      whereIamMember.map(async (member) => {
        let completedTasksForThisProject = await taskModel
          .find({
            assignedTo: member._id,
            isDone: true,
          })
          .select("forProject task isDone")
          .populate("forProject");
        allCompletedTasks.push(...completedTasksForThisProject);
      }),
    );
    let cleanCompletedTasks: CleanTask[] = [];
    cleanCompletedTasks = allCompletedTasks.map((completedTask: any) => {
      return {
        task: completedTask.task as string,
        projectTitle: completedTask.forProject.title as string,
        projectDeadine: getRealDate(
          completedTask.forProject.deadlineDate,
        ) as string,
        completed: completedTask.isDone as boolean,
      };
    });
    return cleanCompletedTasks;
  } catch (error) {
    console.log(error);
  }
};

export const getProjectDetails = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    let findProjects = await projectModel.find({
      $or: [
        {
          title: {
            $regex: parameterObj.projectKeyword.toString(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: parameterObj.projectKeyword.toString(),
            $options: "i",
          },
        },
      ],
    });
    if (!findProjects) return [];
    let cleanProjectDetails: CleanProject[] = [];
    await Promise.allSettled(
      findProjects.map(async (project) => {
        const projectId = project._id;
        let areYouMember = await memberModel
          .findOne({
            forProject: projectId,
            user: userId,
          })
          .select("-forProject -user");
        if (areYouMember) {
          const projectDetails = project;
          cleanProjectDetails.push({
            title: projectDetails.title,
            description:
              projectDetails.description.toString().slice(0, 30) + "...",
            completed: projectDetails.isDone,
            deadline: getRealDate(projectDetails.deadlineDate),
            daysRemaining: deadLineCalc(projectDetails.deadlineDate),
            isFailed: projectDetails.isFailed,
          });
        }
      }),
    );
    return cleanProjectDetails;
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (userId: string) => {
  try {
    let profileData = await userModel
      .findById(userId)
      .select("-allowed -password -profilepic -paymentStatus")
      .populate("companyId");
    let cleanProfileData: CleanProfile = {
      name: "",
      companyName: "",
      isUserManager: false,
    };
    cleanProfileData.name = profileData.name;
    ((cleanProfileData.companyName = profileData.companyId.companyName),
      (cleanProfileData.isUserManager = profileData.isManager));
    return cleanProfileData;
  } catch (error) {
    console.log(error);
  }
};

export const getNotifications = async (userId: string) => {
  try {
    let cleanUnreadNotifications: CleanNotification[] = [];
    let allUnreadNotifications = await notificationModel
      .find({
        forUser: userId,
        isRead: false,
      })
      .select("byUser on forProject")
      .populate("byUser")
      .populate("forProject");
    cleanUnreadNotifications = allUnreadNotifications.map((notification) => {
      return {
        about: notification.on,
        byUser: notification.byUser.name,
        forProject: notification.forProject.title,
      };
    });
    return cleanUnreadNotifications;
  } catch (error) {
    console.log(error);
  }
};

export const renameTitle = async (userId: string, parameterObj: Parameter) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword} & data is : ${parameterObj.newProjectData}`,
    );
    const data = parameterObj.newProjectData.trim();
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can change the title of this project";
    if (!data || data.toString().length < 5) {
      return "Project title cannot be less than 5 characters";
    }
    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        title: data,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};

export const changeDescription = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword} & data is : ${parameterObj.newProjectData}`,
    );
    const data = parameterObj.newProjectData.trim();
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can change the description of this project";
    if (!data || data.toString().trim().length < 20)
      return "Project description cannot be less than 20 characters";
    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        description: data,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};

export const markAsComplete = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword}`,
    );
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can mark this project as complete";

    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        isDone: true,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};

export const markAsInComplete = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword}`,
    );
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can mark this project as incomplete";

    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        isDone: false,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};

export const markAsFailed = async (userId: string, parameterObj: Parameter) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword}`,
    );
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can mark this project as failed";

    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        isFailed: true,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};

export const markAsNotFailed = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    console.log(
      `Keyword actually received in func : ${parameterObj.projectKeyword}`,
    );
    let project = await projectModel.findOne({
      $or: [
        { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
        { description: { $regex: parameterObj.projectKeyword, $options: "i" } },
      ],
    });
    if (!project) return [];
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    if (!areYouMember.isAdmin)
      return "Only admin can mark this project as not failed";

    let changedProject = await projectModel.findByIdAndUpdate(
      project._id,
      {
        isFailed: false,
        addedMs: Date.now(),
      },
      { new: true },
    );
    const allMembersOfThatProject = await memberModel.find({
      forProject: project._id,
    });
    await Promise.allSettled(
      allMembersOfThatProject.map(async (member) => {
        await clearAllProjects(member.user);
      }),
    );
    const companyId = await userModel.findById(userId).select("companyId");
    await clearProjectDetails(project._id, companyId);
    const cleanProject: CleanProject = {
      title: changedProject.title,
      description: changedProject.description.toString().slice(0, 30) + "...",
      deadline: getRealDate(changedProject.deadlineDate),
      daysRemaining: deadLineCalc(changedProject.deadlineDate),
      completed: changedProject.isDone,
      isFailed: changedProject.isFailed,
    };
    return cleanProject;
  } catch (error) {
    console.log(error);
  }
};
export const assignTask = async (userId: string, parameterObj: Parameter) => {
  try {
    let project = await projectModel
      .findOne({
        $or: [
          { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
          {
            description: { $regex: parameterObj.projectKeyword, $options: "i" },
          },
        ],
      })
      .select("_id title deadlineDate");
    if (!project)
      return `No project named ${parameterObj.projectKeyword} found`;
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("_id user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    let assignedToUser = await userModel
      .findOne({
        name: { $regex: parameterObj.userKeyword, $options: "i" },
      })
      .select("_id name");
    if (!assignedToUser)
      return `Member to whom you are trying to assign the task ${parameterObj.taskKeyword} could not be found, please enter correct member's name`;
    let memberOfThatProject = await memberModel
      .findOne({
        user: assignedToUser._id,
        forProject: project._id,
      })
      .select("_id");
    await clearAllTasks(project._id);
    if (!memberOfThatProject)
      return `${assignedToUser.name} is not a member of the project ${parameterObj.projectKeyword}`;
    const newTask = await taskModel.create({
      task: parameterObj.taskKeyword,
      assignedBy: areYouMember._id,
      assignedTo: memberOfThatProject._id,
      forProject: project._id,
      addedAt: Date.now(),
      isDone: false,
    });
    const cleanAssignedTask: CleanAssignedTask = {
      task: newTask.task,
      projectDeadine: getRealDate(project.deadlineDate),
      projectTitle: project.title,
      completed: false,
      assignedTo: assignedToUser.name,
    };
    return cleanAssignedTask;
  } catch (error) {
    console.log(error);
  }
};
export const completeTask = async (userId: string, parameterObj: Parameter) => {
  try {
    let project = await projectModel
      .findOne({
        $or: [
          { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
          {
            description: { $regex: parameterObj.projectKeyword, $options: "i" },
          },
        ],
      })
      .select("_id title deadlineDate");
    if (!project)
      return `No project named ${parameterObj.projectKeyword} found`;
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("_id user isAdmin");
    console.log(
      "You member ? : ",
      areYouMember + " so member id is : ",
      areYouMember._id,
    );
    if (!areYouMember) return "You are not a member of this project";
    let task = await taskModel
      .findOne({
        task: { $regex: parameterObj.taskKeyword, $options: "i" },
      })
      .select("task assignedTo forProject");
    if (!task)
      return `No task like ${parameterObj.taskKeyword} could be found in ${project.title}`;
    console.log(
      "Task found : ",
      task + " so task id assigned to id  : ",
      task.assignedTo,
    );
    if (task.assignedTo.toString() != areYouMember._id.toString()) {
      return `Task ${task.task} is not assigned to you`;
    }
    await clearAllTasks(project._id);
    const updatedTask = await taskModel.findByIdAndUpdate(
      task._id,
      {
        isDone: true,
      },
      { new: true },
    );
    const cleanAssignedTask: CleanTask = {
      task: updatedTask.task,
      projectDeadine: getRealDate(project.deadlineDate),
      projectTitle: project.title,
      completed: true,
    };
    return cleanAssignedTask;
  } catch (error) {
    console.log(error);
  }
};
export const inCompleteTask = async (
  userId: string,
  parameterObj: Parameter,
) => {
  try {
    let project = await projectModel
      .findOne({
        $or: [
          { title: { $regex: parameterObj.projectKeyword, $options: "i" } },
          {
            description: { $regex: parameterObj.projectKeyword, $options: "i" },
          },
        ],
      })
      .select("_id title deadlineDate");
    if (!project)
      return `No project named ${parameterObj.projectKeyword} found`;
    let areYouMember = await memberModel
      .findOne({ user: userId, forProject: project._id })
      .select("_id user isAdmin");
    if (!areYouMember) return "You are not a member of this project";
    let task = await taskModel
      .findOne({
        task: { $regex: parameterObj.taskKeyword, $options: "i" },
      })
      .select("task assignedTo forProject");
    if (!task)
      return `No task like ${parameterObj.taskKeyword} could be found in ${project.title}`;
    if (task.assignedTo.toString() != areYouMember._id.toString()) {
      return `Task ${task.task} is not assigned to you`;
    }
    await clearAllTasks(project._id);
    const updatedTask = await taskModel.findByIdAndUpdate(
      task._id,
      {
        isDone: false,
      },
      { new: true },
    );
    const cleanAssignedTask: CleanTask = {
      task: updatedTask.task,
      projectDeadine: getRealDate(project.deadlineDate),
      projectTitle: project.title,
      completed: false,
    };
    return cleanAssignedTask;
  } catch (error) {
    console.log(error);
  }
};

export const toolChooser: any = {
  getProjects,
  getPendingTasks,
  getCompletedTasks,
  getNotifications,
  getProfile,
  getProjectDetails,
  renameTitle,
  changeDescription,
  markAsComplete,
  markAsInComplete,
  markAsFailed,
  markAsNotFailed,
  assignTask,
  completeTask,
  inCompleteTask,
};
