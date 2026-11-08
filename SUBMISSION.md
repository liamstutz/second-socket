# Second Socket

## Elevator pitch
One donor. More second chances. AI-assisted repair planning turns recovered PC parts into compatible, budgeted rescue plans with PayPal Sandbox checkout.

## Inspiration
I have built 32 computers for friends and family since seventh grade. That experience taught me how often the useful part of a computer outlives the machine around it. I wanted to ask a different shopping question: instead of finding a replacement for one broken PC, what is the smallest purchase that gives an entire repair bench another chance?

## What it does
Second Socket helps a reuse workshop turn technician notes, component requirements and a limited parts budget into an auditable rescue plan. Its local machine-learning model suggests whether a note describes a memory, storage or power-supply issue. A person confirms the requirement. Explicit compatibility checks and an exact allocation solver then determine which donor bundles or individual parts can serve the most machines.

In the synthetic demonstration, a $68 donor contains compatible memory, storage and power for three different PCs. The cheapest compatible individual-part basket in the same catalog costs $89. A seemingly cheaper $39 donor fails two of the three requirements. Change the budget or remove inventory and the plan recalculates immediately.

Every allocation has a compatibility receipt. Every physical part can be assigned once. Unknown or failed checks cannot be overridden by the AI. A downloadable manifest preserves the plan and evidence.

## How we built it
The application uses JavaScript, HTML and CSS with a dependency-free Node.js development server and a deployable Cloudflare Worker. An inspectable multinomial Naive Bayes model learns from 36 authored synthetic repair notes. The planning engine searches offer combinations, assigns compatible components without duplication, and prioritizes the number of complete repair plans before cost.

The PayPal integration uses the JavaScript SDK and Sandbox Orders v2. The server recomputes the basket from trusted inventory, creates an itemized order after human confirmation, and binds a signed checkout receipt to the browser. Capture success requires a matching completed amount, currency and plan reference. Sandbox credentials remain on the server.

AI coding assistance was used to implement and test this prototype.

## Challenges
A low sticker price is not the same as a low repair cost. The solver must account for whole donor bundles, incompatible parts and parts that would otherwise be counted twice. Another challenge was separating a language-model suggestion from evidence that justifies a purchase: the model can suggest a category, but only explicit compatibility checks and human review can clear a plan for checkout.

## Accomplishments
The prototype replans interactively as budget and inventory change, explains each match, rejects incompatible or unverified parts, and exports its evidence. Sixteen automated tests cover allocation, budget limits, model routing/abstention and checkout integrity using PayPal response fixtures.

## What we learned
Repair planning becomes more interesting when the unit of optimization is the whole workshop. Buying one damaged machine can serve several repairs. Keeping that decision understandable is just as important as finding it.

## What's next
Replace the synthetic catalog with a repair partner's real inventory and manufacturer specifications, evaluate on technician-reviewed notes, add stock reservations and durable order reconciliation, and measure actual repair outcomes. The current prototype makes no claim about real-world repairs, carbon savings or model accuracy.

## Current verification status — remove only after completing these steps
The planner and local classifier work. PayPal create/capture code is implemented and fixture-tested; actual sandbox account checkout has not yet been verified. The site visibly reports that state. Source: https://github.com/liamstutz/second-socket . The final entry still needs a YouTube video demonstrating the working application, including the sandbox flow.

