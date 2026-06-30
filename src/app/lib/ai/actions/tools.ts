export const tools = [
  {
    name: "getPendingTasks",
    description: "Returns all pending tasks of the authenticated user.",
    parameters: ["userId"],
    returns: "Array of pending tasks.",
  },
  {
    name: "getProjects",
    description: "Returns all projects of the authenticated user.",
    parameters: ["userId"],
    returns: "Array of project members.",
  },
  {
    name: "getCompletedTasks",
    description: "Returns all completed tasks of the authenticated user.",
    parameters: ["userId"],
    returns: "Array of completed tasks.",
  },
  {
    name: "getNotifications",
    description: "Returns all unread notifications of the authenticated user.",
    parameters: ["userId"],
    returns: "Array of unread notifications.",
  },
  {
    name: "getProfile",
    description: "Returns all information of the authenticated user.",
    parameters: ["userId"],
    returns: "An object containing user's data",
  },
  {
    name: "getProjectDetails",
    description: "Returns all information of the requested project.",
    parameters: ["userId", "project title or description's keyword"],
    returns: "An object containing project's data",
  },
  {
    name: "renameTitle",
    description: "Changes the title of the requested project.",
    parameters: [
      "userId",
      "project title or description's keyword and the new title that is to be replaced by the old one",
    ],
    returns: "Changes Project's title",
  },
  {
    name: "changeDescription",
    description: "Changes the description of the requested project.",
    parameters: [
      "userId",
      "project title or description's keyword and the new description that is to be replaced by the old one",
    ],
    returns: "Changes Project's title",
  },
  {
    name: "markAsComplete",
    description: "Marks the requested project as complete",
    parameters: ["userId", "project title or description's keyword"],
    returns: "Changes Project's completion status to complete",
  },
  {
    name: "markAsInComplete",
    description: "Marks the requested project as incomplete",
    parameters: ["userId", "project title or description's keyword"],
    returns: "Changes Project's completion status to incomplete",
  },
  {
    name: "markAsFailed",
    description: "Marks the requested project as failed",
    parameters: ["userId", "project title or description's keyword"],
    returns: "Changes Project's progress status to failed",
  },
  {
    name: "markAsNotFailed",
    description: "Marks the requested project as not failed",
    parameters: ["userId", "project title or description's keyword"],
    returns: "Changes Project's progress status to not failed",
  },
];
