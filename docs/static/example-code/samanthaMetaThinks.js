#!/bin/playground
// WIP!!!
// Import a few important pieces from the socialagi library
// check out https://www.socialagi.dev/ for further detail
import {
  Action,
  CortexStep,
  CortexScheduler,
  ChatMessageRoleEnum,
} from "socialagi";
import playground from "playground";

const blueprint = Blueprints.SAMANTHA;
const goal = `Making the user happy`;
let internalThoughtProcess = ["feelsToThemself", "wondersAboutIntention"];

const samanthaReplies = async (signal, newMemory, lastStep) => {
  let dialog = lastStep.withMemory(newMemory);

  let thoughtProcess = dialog;
  for (const process of internalThoughtProcess) {
    thoughtProcess = await thoughtProcess.next(Action.INTERNAL_MONOLOGUE, {
      action: process,
      description: `Thinks to themselves internally`,
    });
    playground.log(`${process}: ${thoughtProcess.value}`);
  }
  const says = await thoughtProcess.next(Action.EXTERNAL_DIALOG, {
    action: "says",
    description: `what ${blueprint.name} says out loud next`,
  });
  const newAssistantMemory = [
    {
      role: ChatMessageRoleEnum.Assistant,
      content: says.value as string,
    },
  ];
  dialog = dialog.withMemory(newAssistantMemory);
  playground.addMessage({ sender: "Samantha", message: says.value });
  const decision = await dialog.next(Action.DECISION, {
    action: "decides",
    description: `Consider the prior dialog and the goal of ${goal}. ${blueprint.name} has the following INTERNAL METACOGNITION: [${intermediateThoughtProcess}]. Should the INTERNAL METACOGNITION change or stay the same?`,
    choices: ["changeThoughtProcess", "keepProcessTheSame"],
  });
  playground.log(`decides to: ${decision.value}}`);
  if (decision.value === "changeThoughtProcess") {
    const newProcess = await decision.next(Action.BRAINSTORM_ACTIONS, {
      actionsForIdea:
        `Previously, ${blueprint.name} used the following INTERNAL METACOGNITION to think to themselves before speaking: [${intermediateThoughtProcess}]. Now, REVISE the INTERNAL METACOGNITION, adding, deleting, or modifying the processes.
        
For example. Revise [process1, process2] to [process1', process4, process5]. The revised processes must be different than the prior ones.

MAKE SURE the new actions are all parts of one's INTERNAL thought process PRIOR to speaking to the user, directed at oneself. Actions like provoking are all more external and don't qualify.   
`.trim(),
    });
    internalThoughtProcess = newProcess.value as string[];
    playground.log(`concludes: ${internalThoughtProcess}`);
  }

  return dialog;
};
const samanthaRepliesConfig = {
  name: "SamanthaReplies",
  process: samanthaReplies,
};
const initialMemories = [
  {
    role: ChatMessageRoleEnum.System,
    content: `<CONTEXT>You are modeling the mind of ${blueprint.name}

${blueprint.personality}

${blueprint.name} has the following goal of: ${goal}

</CONTEXT>`,
  },
];
let firstStep = new CortexStep("Samantha");
firstStep = firstStep.withMemory(initialMemories);
const cortex = new CortexScheduler(firstStep);
cortex.register(samanthaRepliesConfig);

// add initial context messages
setTimeout(() => {
  playground.addMessage({
    sender: "Playground",
    message: "In this example, Samantha gets to choose how she thinks",
  });
  playground.addMessage({
    sender: "Playground",
    message: "Try annoying Samantha and see how her thought process adjusts",
  });
  playground.log("Playground initialized");
}, 1);

playground.on("userMessage", async (message) => {
  cortex.dispatch("SamanthaReplies", {
    role: "user",
    content: message,
  });
});
