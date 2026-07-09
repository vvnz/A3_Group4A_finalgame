# Sealegs | Group 4A | Sydney Bernal, Darren Millar, Catherina Yin, Vivian Zhao

## Description

Sealegs is a 2D platformer that tests players in traversing through their ship while experiencing challenges rooted in the real experiences of people with vestibular disorders. Across the first level, players navigate the ship, balancing a constantly increasing seasickness meter that respawns the player at the last checkpoint if its maximum is exceeded. As it increases, the player’s movements meet resistance and traversal difficulty. They must also avoid other obstacles, such as spikes and rats.

## Design Rationale

Sealegs teaches players how to interact with the world through both perceived and real affordances [22]. The starting screen crafts a storyline and introduces the main characters and controls while first presenting the seasick concept. Before any mechanics appear, players understand the goal of the game and how to get there. Once gameplay starts, hazards communicate their purpose through familiar shapes. For example, spikes are conventionally dangerous and the barrels look like obstacles, so players naturally assume they should avoid or jump over them. These assumptions match the real consequences and builds players' trust in the game’s visual language.

The lantern introduces a more nuanced affordance [22]. Players quickly learn it reduces seasickness, but the meter continues to increase once players start moving again. This forces players to be intentional with their movements and be mindful of their jump timing.

Level 1 follows GameFlow principles by introducing players with simple traversal before presenting timing‑based hazards [24]. Instant resets keep the pace moving, and reaching the helm provides a straightforward goal that ties back to the intro’s urgency.

We integrated the realities of vestibular disorder through the main seasickness mechanic that follows a seasickness meter that increases as players move [23]. Once a threshold is surpassed, the player's screen begins shaking, reflecting the sense of imbalance and visual disturbance that those with vestibular disorder experience. As previously explained, this works in tandem with our lantern mechanic that counteracts these effects.

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**

- ‘A’ – move left
- ‘D’ – move right
- 'W' - jump
- ‘SPACE’ – jump
- Press and hold 'E' - turn off the lantern
- ‘ENTER’ - advance to next dialogue screen

**Opening the Chrome Console**

- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

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
[22] Cardona-Rivera, R. E., and Young, R. M. 2013. A Cognitivist Theory of Affordances for Games. Proceedings of DiGRA 2013 Conference: DeFragging Game Studies.
Digital Games Research Association (DiGRA), Atlanta, GA, USA.

[23] Cleveland Clinic. 2024. Vestibular Disorders: Symptoms, Causes & Treatment. Cleveland Clinic. Retrieved July 9, 2026 from https://my.clevelandclinic.org/health/diseases/vestibular-disorders

[18] DRAGON_STUDIO. n.d. Seagull Calls. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-seagull-calls-339723/

[19] Magiksolo. n.d. Pirate Tavern (Full Version!). Audio. Retrieved July, 6, 2026 from https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/

[24] Penelope Sweetser and Peta Wyeth. 2005. GameFlow: A model for evaluating player enjoyment in games. Computers in Entertainment 3, 3 (2005), 1–24. https://doi.org/10.1145/1077246.1077253

[20] Universfield. n.d. Water Splash 02. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-water-splash-02-352021/

[21] Justprince, Stefie. 2021. Pixelify Sans. Typeface. Retrieved July, 2, 2026 from https://fonts.google.com/specimen/Pixelify+Sans
