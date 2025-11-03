This is a working Next.js application created from Vercel's Next.js boilerplate. We now need to modify this code to create a web application called "Who Versus".

Before we begin, I will provide you with all the necessary background information. Respond with a confirmation that you have received this information.

I will supply you with the next instructions immediately after your confirmation.

## Background
- "Who Versus" is a web application that allows users to challenge other people to a game that they can create.
- Here is the vocabulary I would like to use for this application ...
    - **Versus** = A game or challenge created by a user
    - **Player** = A user of this app and a participant in a *Versus*
    - **Objectives** = The rules of the *Versus*
    - **Points** = A numerical value associated with each *Versus* *Objective*
    - **Score** = The total *Points* earned by each *Player* by completing *Objectives* in a *Versus*
    - **Ranking** = Where the *Player's* *Score* ranks among the other *Players* in the *Versus*
    - **Commisioner** = A *Player* category that denotes their ability to edit *Objectives* in a *Versus*
- Once a *Versus* has started *Players* will mark that they have completed *Objectives* themselves.

## Coding Preferences
- We will use the languages and libraries already included in this Vercel Next.js boilerplate.
- I would like to add shadcn to extend Tailwind with components.
- I would like to integrate a Supabase db for storing data and integrating authentication for the *Players*. I've already created the DB and just need help integrating it.

## Functionality
- The site will start with *Player* authentication pages for login or sign-up.
- After logging in, the app will have a standard nav bar at the top with a centered logo, a home button left aligned, and a plus button right aligned.
- Development should start with the creation of 3 pages (see /docs/visual/initial-3-pages.png):
    - The Home page is a list of the *Player's* *Versus* showing their *Score* and *Ranking* within that *Versus*
    - The Individual Versus page is a landing page for a specific *Versus* that shows the *Player's* *Score* & *Ranking*, a collapsible score board, a collapsible history feed, and a menu option at the top right next to the name
    - The Create Versus page will be the first step in a mult-step form to create a new Versus. The first step has a "Name" field and a check box for "Reverse Ranking"
– Clicking the Home Button and logo goes to the Home page.
- Clicking one of the Versus on the Home page goes to the Individual Versus page.
- Clicking the plus button in the header goes to the Create Versus page.

## Visual Identity
- Review /docs/visual/Who_Versus_Visual_Identity_Brief.md for details.

Please confirm your understanding of my instructions and the initial context before we proceed.