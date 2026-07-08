# Sealegs | Group 4A | Sydney Bernal, Darren Millar, Catherina Yin, Vivian Zhao

## Description

Sealegs is a 2D platformer that tests players to traverse through their ship while experiencing challenges rooted in the real experiences of people with vestibular disorder. Across the first level, players navigate the ship, balancing a constantly increasing seasickness meter that respawns the player at the last checkpoint if its maximum is exceeded. As it increases, the player’s movements meet resistance and traversal difficulty. They must also avoid other obstacles, such as spikes and rats.

## Design Rationale

Sealegs relies on strong perceived affordances and real affordances to teach players how to interact with the world intuitively. The intro screen establishes instability through diegetic cues — the ship shaking, the parrot’s urgency, and the player’s seasickness — priming players to expect environmental challenge. Once gameplay begins, hazards communicate their function through familiar visual language: spikes look dangerous, barrels look like obstacles, and players correctly infer they must jump over them. These perceived affordances align with real consequences, reinforcing trust in the game’s visual logic. The lantern mechanic adds a layered affordance: its warm glow suggests comfort and stability, and players quickly learn it reduces seasickness — but only up to a threshold, teaching them to manage limited relief rather than rely on it fully.

Level 1’s structure follows GameFlow principles by introducing mechanics gradually and reinforcing learning through immediate feedback. The level begins with simple platforming, allowing players to build confidence in movement and timing. Instant resets on failure maintain momentum and reduce frustration, while reaching the helm provides a clear, motivating goal that aligns with the narrative setup.

Vestibular disorder integration is woven directly into the game’s feel rather than treated as decoration. Environmental instability, such as subtle screen shake or uneven platform motion, mirrors real disorientation and challenges spatial judgment. The intro’s seasickness dialogue contextualizes these mechanics, helping players understand why movement may feel unstable. Timing pressure from hazards simulates the difficulty of reacting while dizzy, requiring players to slow down, observe cues, and plan jumps deliberately. These choices ensure the disability meaningfully shapes navigation, pacing, and decision‑making throughout Level 1.

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**

- ‘W’ – move left
- ‘D’ – move right
- ‘SPACE’ – jump
- Press and hold 'E' - turn off the lantern
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

## Assets

| File                                              | Source                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `assets/images/background_intro.png`              | [Drawn by Catherina Yin] [1]                                                                                                         |
| `assets/images/barrel.png`                        | [Drawn by Catherina Yin] [2]                                                                                                         |
| `assets/images/dialogue.png`                      | [Drawn by Catherina Yin] [3]                                                                                                         |
| `assets/images/doorclose.png`                     | [Drawn by Catherina Yin] [4]                                                                                                         |
| `assets/images/dooropen.png`                      | [Drawn by Catherina Yin] [5]                                                                                                         |
| `assets/images/hammock.png`                       | [Drawn by Catherina Yin] [6]                                                                                                         |
| `assets/images/lantern.png`                       | [Drawn by Catherina Yin] [7]                                                                                                         |
| `assets/images/lvl1background.png`                | [Drawn by Catherina Yin] [8]                                                                                                         |
| `assets/images/parrot_dialogue.png`               | [Drawn by Catherina Yin] [9]                                                                                                         |
| `assets/images/pirate_dialogue.png`               | [Drawn by Catherina Yin] [10]                                                                                                        |
| `assets/images/pirate_sprite.png`                 | [Drawn by Catherina Yin] [11]                                                                                                        |
| `assets/images/platform_tile.png`                 | [Drawn by Catherina Yin] [12]                                                                                                        |
| `assets/images/rat.png`                           | [Drawn by Catherina Yin] [13]                                                                                                        |
| `assets/images/sealegs_logo.png`                  | [Drawn by Catherina Yin] [14]                                                                                                        |
| `assets/images/sign.png`                          | [Drawn by Catherina Yin] [15]                                                                                                        |
| `assets/images/spritesheet.png`                   | [Drawn by Catherina Yin] [16]                                                                                                        |
| `assets/images/title.png`                         | [Drawn by Catherina Yin] [17]                                                                                                        |
| `assets/sounds/seagulls.mp3`                      | DRAGON_STUDIO. Seagull Calls - Sourced from https://pixabay.com/sound-effects/nature-seagull-calls-339723/ [18]                      |
| `assets/sounds/bgm.mp3`                           | Magiksolo. Pirate Tavern (Full Version!) - Sourced from https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/ [19] |
| `assets/sounds/splash.mp3`                        | Universfield. Water Splash 02 - Sourced from https://pixabay.com/sound-effects/nature-water-splash-02-352021/ [20]                   |
| `assets/fonts/PixelifySans-VariableFont_wght.ttf` | Stefie Justprince. Pixelify Sans - Sourced from https://fonts.google.com/specimen/Pixelify+Sans [21]                                 |

## References

[18] DRAGON_STUDIO. n.d. Seagull Calls. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-seagull-calls-339723/

[19] Magiksolo. n.d. Pirate Tavern (Full Version!). Audio. Retrieved July, 6, 2026 from https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/

[20] Universfield. n.d. Water Splash 02. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-water-splash-02-352021/

[21] Justprince, Stefie. 2021. Pixelify Sans. Typeface. Retrieved July, 2, 2026 from https://fonts.google.com/specimen/Pixelify+Sans
