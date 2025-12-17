# clean-IQ

CleanIQ is a janitor optimization software that operates based off data collected by sensors within specific bathrooms on a floor. This software was coded using assistance from Codex AI and was designed for an entrepreneurship in engineering class I took my first semester at the University of Miami (EGN 110). It's also the first large coding project I've ever coded, and first which involved an advanced user interface and database system.

The way in which the software operates is through sensors placed inside bathrooms on a specific floor. There should be one sensor at the top of a bathroom door, and the sensor counts the number of times the door is opened. For every two times the door opens, the system counts one "use" in its system. There will also be sensors placed on soap and toilet paper dispensers, monitoring their levels. Using this data, a "score" will be calculated using an algorithm within the code that gives an idea of how urgently the bathroom needs to be cleaned. A perfectly clean bathroom starts with a score of 100, and the number of uses and levels of toilet paper and soap will subtract from the score accordingly. The lower the bathroom's score, the more urgently it needs to be cleaned.

Along with this scoring system, the program also has the feature of creating a customized route for janitors on a specific floor to follow. Based off both the lowest score and proximity to the nearest bathroom, a list of which bathroom the janitor should clean, in order, will be generated. This way, janitors are maximizing their efficiency by reducing the time to get from bathroom to bathroom, and unnecessarily checking restrooms that are already clean and have a high score.

In the system, there are two dashboards: the manager, and the janitor. On the manager side, there is a list of all bathrooms in the database, a list of employees scheduled in the system, and the three floors who have the lowest average bathroom score. On the janitor side, there is their personalized route, and all the buildings on their assigned floor.

To run the project in GitHub, run "node server.js". I hope you enjoy this project, and more will be released in the near future!

