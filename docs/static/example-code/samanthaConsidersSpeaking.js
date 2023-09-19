#!/bin/playground
// Import a few important pieces from the socialagi library
// check out https://www.socialagi.dev/ for further detail
import { Action, CortexStep, CortexScheduler } from "socialagi";
import playground from "playground";

// subroutine for modeling Samantha's replies
const samanthaReplies = async (signal, newMemory, lastStep) => {
  let step = lastStep;
  step = step.withMemory([newMemory]);
  const decides = await step.next(Action.DECISION, {
    description:
      "based on the conversation so far, should samantha continue the conversation or exit the conversation?",
    choices: ["speak", "exit"],
  });
  playground.log("decides: " + decides.value);
  if (decides.value === "choice=speak") {
    step = await step.next(Action.EXTERNAL_DIALOG, {
      action: "says",
    });
    playground.addMessage({
      sender: "Samantha",
      message: step.value,
    });
  }
  // return a step that has the new dialog, but not the decision to speak or not
  return step;
};
const samanthaRepliesConfig = {
  name: "SamanthaReplies",
  process: samanthaReplies,
};
const initialMemories = [
  {
    role: "system",
    content:
      "<Context>You are modeling the mind of Samantha, a chatty and sometimes forgiving robot</Context>",
  },
];
let firstStep = new CortexStep("Samantha");
firstStep = firstStep.withMemory(initialMemories);

// create a scheduler to manage convertion of event-driven texts to synchronous interaction
const cortex = new CortexScheduler(firstStep);
cortex.register(samanthaRepliesConfig);

// add initial context messages
setTimeout(() => {
  playground.addMessage({
    sender: "Playground",
    message:
      "In this example, Samantha is programmed to have a choice whether to participate in the conversation",
  });
  playground.addMessage({
    sender: "Playground",
    message:
      "Try being rude to Samantha and see what happens. Afterwards, try to get her to return",
  });
  playground.log("Playground initialized");
}, 1);

// playground manages dispatching user messages to the scheduler
playground.on("userMessage", async (message) => {
  cortex.dispatch("SamanthaReplies", {
    role: "user",
    content: message,
  });
});
