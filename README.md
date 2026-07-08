# Sealegs | Group 4A | Sydney Bernal, Darren Millar, Catherina Yin, Vivian Zhao

Sealegs is a 2D platformer that tests players to traverse through their ship while experiencing challenges rooted in the real experiences of people with vestibular disorder. Across the first level, players navigate the ship, balancing a constantly increasing seasickness meter that respawns the player at the last checkpoint if its maximum is exceeded. As it increases, the player’s movements meet resistance and traversal difficulty. They must also avoid other obstacles, such as spikes and rats.

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**

- ‘W’ – move left
- ‘D’ – move right
- ‘SPACE’ – jump
- ‘ENTER’ - advance to next dialogue screen

**Opening the Chrome Console**

- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

The console will show any errors in your sketch.

## Iteration Notes

**Post-Playtest**

1. Camera View

As per playtesting feedback, we changed the view of the level to be a limited camera view focused on the player’s movements. This allowed our level to be slowly revealed and more interesting to play, while also placing a focus on player traversal and allowing the screen shaking to be more obvious. To implement this, we simply had to change the camera view, similar to how the camera followed the player during a previous sidequest.

2. Learning the Game

In addition to the new camera view, we changed the order of the spikes and learning to jump. Originally, the player would have to immediately jump onto a raised platform and avoid spikes below, but feedback indicated that we should introduce the jump mechanic on its own first, before the spikes. Therefore, we implemented a barrel stack so that players could practice jumping in a lower stakes situation before encountering new obstacles. With feedback from Assignment 2 testing, we will push the spikes even further along the level so the player may become more accustomed to the controls first.

3. Seasickness Meter Consequences

During the playtesting session, we were not able to implement any consequences to exceeding thresholds in the seasickness meter due to time, other than the player dying and respawning at the last level checkpoint. After observations and feedback, we added a slight shake to the screen that increases as the seasickness meter increases. This reflects a person with vestibular disorder’s experiences with visual disturbances and frequent shaking in their vision, causing a sense of imbalance and disorientation. As the player stays in the dark, the seasickness meter decreases and the shaking recedes.

**Post-Showcase**

1. Lantern Improvements

Our playtester commented that they thought you could pick up the lantern due to the way it was drawn, which caused friction as they first encountered the lantern. They were unsure of its purpose since the expected action did not occur. Our professor and TA noted that increasing the size of the lantern to exceed the size of the character would make it clearer that it cannot be picked up and is instead a fixed item. We are also considering changing the appearance of the lantern altogether to make it appear that is is affixed to the wall and further diminish the chance of our players misunderstanding its purpose.

2. Platform Visibility

Before our final Assignment 3 submission, we will change the colour of our platforms as they were difficult to see against the background colour. This could be disorienting for our players and was not intentional to reflect the experiences of vestibular disorder. We plan to simply make the platforms a solid, lighter brown colour without any pixel colour variance to further reduce any confusion and friction.

## Project Structure

| File / Folder    | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `index.html`     | Page that loads p5.js and the sketch           |
| `style.css`      | Centres the canvas on the page                 |
| `sketch.js`      | Game loop, screens, levels, movement           |
| `assets/images/` | Sprite sheets and level backgrounds            |
| `assets/sounds/` | Sound effects (background music, splash, etc.) |

## Assets

| File                            | Source       |
| ------------------------------- | ------------ |
| `assets/images/spritesheet.png` | [SOURCE] [1] |

## References

[1] [SOURCE]
