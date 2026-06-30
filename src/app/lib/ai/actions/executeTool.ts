import { toolChooser } from "./toolChooser";

export async function executeTool(
  tool: string,
  userId: string,
  parameters: any[] | null,
) {
  let toolData: any;
  if (parameters && parameters.length > 0) {
    console.log("Parameter array : ", parameters);
    console.log("Parameters received : ", ...parameters);
    toolData = await toolChooser[tool](userId, ...parameters);
  } else toolData = await toolChooser[tool](userId);
  console.log(toolData);
  return toolData;
}
