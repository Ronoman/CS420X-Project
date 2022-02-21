# Assignment 4: Slime Mold Simulation

I implemented a few fun parameters for this simulation. Sensor distance scales the agent lookahead distance. Turn amount increases the amount the agents will tend to turn. THe pulse frequency will change how often the agents change direction. The diffuse scale is supposed to control the amount of decay on the diffusion shader, but doesn't work very well. The color can be changed, but is implemented poorly. Without any red component in the color, the simulation won't run.

The other fun change is that the amount the agents turn increases as they get further from the center, which creates a kind of lensing effect.

## Preset 1: Slime

This is the "standard" preset. While the agents to randomly turn every so often, it mostly just shifts over time. This changing turn amount keeps the simulation from stagnating for much longer. 

## Preset 2: Chaos

This one continuously shifts between spaghetti and complete disarray of the agents. This is because the agents scale up their turning a lot every so often, which keeps them from following each other well.

## Preset 3: Pulse colony

The pulse colony preset reminds me of ant tunnels. While the simulation does fall into a steady state relatively quickly, it continues to pulse slightly as if its alive. Every so often new connections will be formed as branches connect between the primary colonies.

## Preset 4: Swirls

THis combination of presets induces a very nice effect, in my opinion. Every few seconds, the colony comes to life and grows small, curling branches that quickly collapse back into the main structure. Along with the first preset, this one feels the most alive to me.