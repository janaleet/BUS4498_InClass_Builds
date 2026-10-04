# Workflow of Tasks


## 1. Workflow Overview
### 1.1 Workflow Goal
This workflow supports the system goal defined in `my_first_agent/README.md`.

### 1.2 Workflow Trigger

The workflow will start when a potential attendees registers for the Hackathon.

### 1.3 Completion Condition at Runtime

The system knows that the workflow is completed when it has generated a probability of the registrants attendance.

### 1.4 General Workflow

The normal path without exception paths and human-review points starts with the registrant filling out the registration form and including information such as name, contact info, reason for registering, and overall understanding of AI. The system will then take the information and determine the probability of the registrant attending based on the details. There will be three data points to generate a probability. The first being if they have gone to a club meeting or if they are a member based on their name and contact info. The second data point will be the reason for registering; if the reason seems well thought they will be calculated as more likely to go. The final data point is their understanding of AI. While a lower understanding shouldn't decrease their probability, a higher understanding should increase their probability. The system will then generate a probability for the registrant to attend.

Some exceptions are if the registrant is in a board position for the club as they are highly likely to attend and are in direct conversation with organizers. Human-review points would be if the contact info and name aren't in Cal Poly's data base, the human reviewer should reach out and confirm if the student is a Cal Poly student and update their information accordingly. Another human-review point would be if the registrants reason for attending is not relevant to the Hackathon. The human reviewer would then use their best judgement to assign a probability based on their response.

### 1.5 Workflow Diagram


```mermaid
flowchart TD

classDef default fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
classDef decision fill:#e6e6e6,stroke:#333333,stroke-width:1px,color:#000000
classDef popup fill:#f2f2f2,stroke:#000000,stroke-width:2px,color:#000000
classDef endpoint fill:#333333,stroke:#000000,stroke-width:1px,color:#ffffff

subgraph AUTH["Sign in and account creation"]
  T1["T1: Open sign in page"] --> D1{"D1: Does user have an account?"}
  D1 -->|Yes| T2["T2: Enter email / username and password"]
  D1 -->|No| T3["T3: Click 'Create an account'"]

  T3 --> T4["T4: Open sign up page"]
  T4 --> T5["T5: Enter account information"]
  T5 --> D2{"D2: Is sign up information valid?"}
  D2 -->|No| T6["T6: Show sign up errors"]
  T6 --> T5
  D2 -->|Yes| T7["T7: Create account"]
  T7 --> T1

  T2 --> D3{"D3: Are credentials valid?"}
  D3 -->|No| T8["T8: Show sign in error"]
  T8 --> T2
end

subgraph REG["Hackathon registration"]
  T9["T9: Open hackathon registration page"] --> P1[["P1: Pop-up: Would you like to register?"]]
  P1 -->|No| C1([C1: User not registered])
  P1 -->|Yes| T10["T10: Show registration survey"]

  T10 --> T11["T11: Answer AI comfortability level"]
  T11 --> T12["T12: Answer why they want to join"]
  T12 --> D4{"D4: Does user already have a team?"}

  D4 -->|Yes| P2[["P2: Pop-up: Enter teammate emails"]]
  P2 --> T13["T13: Send email asking teammates to register"]

  D4 -->|No| D5{"D5: Opt into personalized team recommendation?"}
  D5 -->|Yes| T14["T14: Queue team recommendation to send later"]
  D5 -->|No| T15["T15: Submit registration"]

  T13 --> T15
  T14 --> T15
end

subgraph PROC["Registration processing"]
  T16["T16: Capture permitted details"] --> T18["T18: Store registration record"]
  T18 --> C2([C2: User registered for hackathon])
end

subgraph UPD["Registration update or cancellation"]
  T20["T20: Receive change request"] --> D20{"D20: Is this a cancellation?"}
  D20 -->|Yes| T21["T21: Mark registration cancelled"]
  T21 --> C4([C4: Registration record updated])
  D20 -->|No| T22["T22: Apply updated answers"]
end

D3 -->|Yes| T9
T15 --> T16
T22 --> T18

class D1,D2,D3,D4,D5,D20 decision
class P1,P2 popup
class C1,C2,C4 endpoint

style AUTH fill:#fafafa,stroke:#666666,color:#000000
style REG fill:#fafafa,stroke:#666666,color:#000000
style PROC fill:#fafafa,stroke:#666666,color:#000000
style UPD fill:#fafafa,stroke:#666666,color:#000000
```
