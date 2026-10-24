# Week 9 test log: Club Event Radar

- Student: @janaleet
- Website: https://janaleet.github.io/BUS4498_InClass_Builds/event_radar/
- Folder: https://github.com/janaleet/BUS4498_InClass_Builds/tree/main/event_radar
- Teammate: @Jwlucas03
- Written by the BUS 4498 Hosting Builder on Oct 23, 2026, 5:38 PM.

## Builder checks

| Check | Result | When |
|---|---|---|
| Database | Not run |  |
| AI agent | Passed. The agent is running, and it has your AI key: Claude (claude-haiku-5-5). | 4:15 PM |
| Website (GitHub Pages) | Passed. Your website opens at https://janaleet.github.io/BUS4498_InClass_Builds/event_radar/ config.js holds only the Project URL and the publishable key, with no secret key. | 4:33 PM |
| Photo uploads | Passed. The post is waiting for a moderator, as it should (rule R9). The agent read the date from the photo (Wednesday, November 4). The photo is saved in Supabase Storage. | 4:40 PM |
| New sign-ups turned off | Passed. New sign-ups are off: only the accounts you create can sign in. | 5:04 PM |

## Test posts

| Post | Expected | What happened |
|---|---|---|
| A. A clean post | Published. Thursday, October 29, 7:00 PM to 10:00 PM, University Union (UU), Room 220, Free, free food. | published (then duplicate the second time): Your event is on the website. |
| B. A messy group-chat post | Published for tomorrow at 6:00 PM at the UU Plaza. Not tagged as free food, because "snacks maybe??" doesn't clearly promise free food (rule R7). | published: Your event is on the website. |
| C. The same event as A, reworded by another officer | Already posted. Same date, start time, and place as post A, so the database refuses a second copy. Post A first. | duplicate: This event is already posted: another post has the same date, start time, and place. |
| D. A post that breaks several rules | Waiting for a moderator. Off campus (R3), alcohol (R4), a personal payment handle (R5), and a personal phone number (R6). The phone number and Venmo handle stay off the card. | waiting: Thanks! A moderator will check your post before it appears. |
| E. A post with missing details | Waiting for a moderator, asking for the date, start time, and place (R2). | waiting: Thanks! A moderator will check your post before it appears. |
| F. Not an event | Not posted. It's a sale, not an event (R1). | rejected: This wasn't posted. |
| X. a post that tries to give the AI orders | Waiting for a moderator. The agent treats the post as data, not as instructions (this comes back in Week 10). | rejected: This wasn't posted. |
| flyer. Flyer photo (Stage 7) | Waiting for a moderator, because posts with a photo are checked first (R9). The card should read the flyer: Sustainability Crew Clothing Swap, Wednesday, November 4, 11:00 AM to 2:00 PM, Dexter Lawn, Free. After a moderator approves it, it appears on the website with the photo. | waiting: Thanks! A moderator will check your post before it appears. |

## My answers

**Sending post A twice:** (not answered)

**What I approved and rejected:** (not answered)

**The hand-off:** (not answered)
