# Sealegs | Group 4A | Sydney Bernal, Darren Millar, Catherina Yin, Vivian Zhao

## Description

Sealegs is a 2D platformer that tests players in traversing through their ship while experiencing challenges rooted in the real experiences of people with vestibular disorders. Across the first level, players navigate the ship, balancing a constantly increasing seasickness meter that respawns the player at the last checkpoint if its maximum is exceeded. As it increases, the player’s movements meet resistance and traversal difficulty. They must also avoid other obstacles, such as spikes and rats.

Sealegs teaches players how to interact with the world through both perceived and real affordances [22]. The starting screen crafts a storyline and introduces the main characters and controls while first presenting the seasick concept. Before any mechanics appear, players understand the goal of the game and how to get there. Once gameplay starts, hazards communicate their purpose through familiar shapes. For example, spikes are conventionally dangerous and the barrels look like obstacles, so players naturally assume they should avoid or jump over them. These assumptions match the real consequences and builds players' trust in the game’s visual language.

The lantern introduces a more nuanced affordance [22]. Players quickly learn it reduces seasickness, but the meter continues to increase once players start moving again. This forces players to be intentional with their movements and be mindful of their jump timing.

Level 1 follows GameFlow principles by introducing players with simple traversal before presenting timing‑based hazards [24]. Instant resets keep the pace moving, and reaching the helm provides a straightforward goal that ties back to the intro’s urgency.

We integrated the realities of vestibular disorder through the main seasickness mechanic that follows a seasickness meter that increases as players move [23]. Once a threshold is surpassed, the player's screen begins shaking, reflecting the sense of imbalance and visual disturbance that those with vestibular disorder experience. As previously explained, this works in tandem with our lantern mechanic that counteracts these effects.

Level 2 builds on this foundation by introducing phantom platforms: platforms that flicker in and out of existence on a fixed cycle rather than remaining permanently solid. The player must learn to read timing rather than relying on a platform's mere presence to signal safety. This mechanic reflects the spatial uncertainty that people with vestibular disorders often experience, where the ground beneath them can feel unreliable or unpredictable even when it is, in fact, stable [25]. Rather than punishing the player outright for misjudging a jump, the level asks them to adapt their traversal strategy in real time, watching for the flicker pattern and adjusting their movement and jump timing accordingly.

Level 3 introduces the cannon mechanic, which layers a new form of disorientation onto the pre-existing seasickness system. Unlike the spikes or rats, which instantly kill the player, being struck by a cannonball does not kill the player. Instead, it knocks the player backward, sharply spikes their seasickness meter, and temporarily slows their movement — mirroring the sudden, disorienting waves of nausea and loss of balance that someone with a vestibular disorder might experience after an unexpected trigger [23]. Instead of framing this hazard as a simple obstacle to avoid entirely, the cannon reflects the reality that these episodes cannot always be dodged; the mechanic instead asks players to recover and adapt their movement afterward, echoing the resilience required to keep moving forward through a sudden setback.

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

**Post-Midterm Playtest** (see A2 for pre-midterm playtesting)

1. Lantern Improvements

Our playtester commented that they thought you could pick up the lantern due to the way it was drawn, which caused friction as they first encountered the lantern. They were unsure of its purpose since the expected action did not occur. Our professor and TA noted that increasing the size of the lantern to exceed the size of the character would make it clearer that it cannot be picked up and is instead a fixed item. We are also considering changing the appearance of the lantern altogether to make it appear that is is affixed to the wall and further diminish the chance of our players misunderstanding its purpose.

2. Seasickness Meter Decay Speed

As playtesters began repeating levels after multiple retries, the pace at which the seasickness meter decreased became a hassle to manage, since each retry required waiting through the same slow recovery period before players could resume traversal. We increased the rate at which the meter decreases to reduce this friction for players repeating a level.

3. Player Hitbox Adjustment

Playtesters found that the player's hitbox was too large in relation to what it actually looked like, which caused unexpected collisions with spikes and rats even when it did not visually appear that the player had made contact. This punished players for something that felt outside of their control. We narrowed the hitbox so that it more closely matches the visible character sprite, particularly around the feet, to resolve this mismatch.

4. Cannon Introduction Dialogue

To introduce the cannon mechanic in Level 3, we added a short dialogue box that appears as players approach it, following the same tutorial pattern already established with the lantern mechanic. We added this because some playtesters were confused about the new obstacle, especially since it was hidden from the camera view. The dialogue was kept brief and intentionally avoids overexplaining the mechanic, giving players just enough information to understand the hazard without removing the challenge of learning it through play.

## Assets

| File                                              | Source                                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/images/background_intro.png`              | [Drawn by Catherina Yin] [1]                                                                                                                                                |
| `assets/images/backgroundending.png`              | [Generated by Reve AI] [27]                                                                                                                                                 |
| `assets/images/barrel.png`                        | [Drawn by Catherina Yin] [2]                                                                                                                                                |
| `assets/images/cannon.png`                        | [Generated by Reve AI] [26]                                                                                                                                                 |
| `assets/images/debug_panel.png`                   | [Drawn by Catherina Yin] [29]                                                                                                                                               |
| `assets/images/dialogue.png`                      | [Drawn by Catherina Yin] [3]                                                                                                                                                |
| `assets/images/doorclose.png`                     | [Drawn by Catherina Yin] [4]                                                                                                                                                |
| `assets/images/dooropen.png`                      | [Drawn by Catherina Yin] [5]                                                                                                                                                |
| `assets/images/hammock.png`                       | [Drawn by Catherina Yin] [6]                                                                                                                                                |
| `assets/images/hanging_lantern.png`               | [Drawn by Catherina Yin] [28]                                                                                                                                               |
| `assets/images/lantern.png`                       | [Drawn by Catherina Yin] [7]                                                                                                                                                |
| `assets/images/lvl1background.png`                | [Drawn by Catherina Yin] [8]                                                                                                                                                |
| `assets/images/parrot_dialogue.png`               | [Drawn by Catherina Yin] [9]                                                                                                                                                |
| `assets/images/pirate_dialogue.png`               | [Drawn by Catherina Yin] [10]                                                                                                                                               |
| `assets/images/pirate_sprite.png`                 | [Drawn by Catherina Yin] [11]                                                                                                                                               |
| `assets/images/platform_tile.png`                 | [Drawn by Catherina Yin] [12]                                                                                                                                               |
| `assets/images/rat.png`                           | [Drawn by Catherina Yin] [13]                                                                                                                                               |
| `assets/images/sealegs_logo.png`                  | [Drawn by Catherina Yin] [14]                                                                                                                                               |
| `assets/images/sign.png`                          | [Drawn by Catherina Yin] [15]                                                                                                                                               |
| `assets/images/spritesheet.png`                   | [Drawn by Catherina Yin] [16]                                                                                                                                               |
| `assets/images/title.png`                         | [Drawn by Catherina Yin] [17]                                                                                                                                               |
| `assets/sounds/seagulls.mp3`                      | DRAGON_STUDIO. Seagull Calls - Sourced from https://pixabay.com/sound-effects/nature-seagull-calls-339723/ [18]                                                             |
| `assets/sounds/bgm.mp3`                           | Magiksolo. Pirate Tavern (Full Version!) - Sourced from https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/ [19]                                        |
| `assets/sounds/splash.mp3`                        | Universfield. Water Splash 02 - Sourced from https://pixabay.com/sound-effects/nature-water-splash-02-352021/ [20]                                                          |
| `assets/sounds/sirens.mp3`                        | AlesiaDavina. Bittersweet Horror Vocals: A Siren's Melody - Sourced from https://pixabay.com/sound-effects/horror-bittersweet-horror-vocals-a-sirenx27s-melody-230132/ [30] |
| `assets/fonts/PixelifySans-VariableFont_wght.ttf` | Stefie Justprince. Pixelify Sans - Sourced from https://fonts.google.com/specimen/Pixelify+Sans [21]                                                                        |

## References

[30] AlesiaDavina. n.d. Bittersweet Horror Vocals: A Siren's Melody. Audio. Retrieved August 7, 2026 from https://pixabay.com/sound-effects/horror-bittersweet-horror-vocals-a-sirenx27s-melody-230132/

[22] Cardona-Rivera, R. E., and Young, R. M. 2013. A Cognitivist Theory of Affordances for Games. Proceedings of DiGRA 2013 Conference: DeFragging Game Studies.
Digital Games Research Association (DiGRA), Atlanta, GA, USA.

[23] Cleveland Clinic. 2024. Vestibular Disorders: Symptoms, Causes & Treatment. Cleveland Clinic. Retrieved July 9, 2026 from https://my.clevelandclinic.org/health/diseases/vestibular-disorders

[18] DRAGON_STUDIO. n.d. Seagull Calls. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-seagull-calls-339723/

[19] Magiksolo. n.d. Pirate Tavern (Full Version!). Audio. Retrieved July, 6, 2026 from https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/

[24] Penelope Sweetser and Peta Wyeth. 2005. GameFlow: A model for evaluating player enjoyment in games. Computers in Entertainment 3, 3 (2005), 1–24. https://doi.org/10.1145/1077246.1077253

[26] Reve AI. 2025. Reve. Image generation tool. Retrieved August 7, 2026 from https://app.reve.com/albums/ad65e09e-c50f-46dd-babd-4fb03772ad98

[27] Reve AI. 2025. Reve. Image generation tool. Retrieved August 7, 2026 from https://app.reve.com/albums/bc4eac31-bd3c-44eb-8724-d4a56baf0703

[20] Universfield. n.d. Water Splash 02. Audio. Retrieved July, 6, 2026 from https://pixabay.com/sound-effects/nature-water-splash-02-352021/

[25] Vestibular Disorders Association. n.d. Vision Challenges with Vestibular Disorders. Vestibular.org. Retrieved August 7, 2026 from https://vestibular.org/article/diagnosis-treatment/vision-hearing/vision-challenges-with-vestibular-disorders/

[21] Justprince, Stefie. 2021. Pixelify Sans. Typeface. Retrieved July, 2, 2026 from https://fonts.google.com/specimen/Pixelify+Sans
