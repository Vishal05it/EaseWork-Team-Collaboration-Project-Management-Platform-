import { toolChooser } from "./toolChooser";

export async function executeTool(
  tool: string,
  userId: string,
  parameters: any | null,
) {
  let toolData: any;
  if (parameters) {
    console.log("Parameter array : ", parameters);
    toolData = await toolChooser[tool](userId, parameters);
  } else toolData = await toolChooser[tool](userId);
  console.log(toolData);
  return toolData;
}
